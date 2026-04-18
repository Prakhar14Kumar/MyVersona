import { useState } from 'react';
import { Sparkles, Hash, Type, Wand2, Loader2, Copy, Check } from 'lucide-react';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from './ui/tabs';
import { toast } from 'sonner';

interface AIContentToolsProps {
  content: string;
  onApplyCaption?: (caption: string) => void;
  onApplyHashtags?: (hashtags: string[]) => void;
}

export function AIContentTools({ content, onApplyCaption, onApplyHashtags }: AIContentToolsProps) {
  const [generating, setGenerating] = useState(false);
  const [generatedCaptions, setGeneratedCaptions] = useState<string[]>([]);
  const [generatedHashtags, setGeneratedHashtags] = useState<string[]>([]);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const generateCaptions = async () => {
    if (!content.trim()) {
      toast.error('Please add some content first');
      return;
    }

    setGenerating(true);
    try {
      // Call AI service to generate captions
      const response = await fetch('http://localhost:8001/api/content-tools/generate-caption', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content })
      });

      if (!response.ok) throw new Error('Failed to generate captions');

      const data = await response.json();
      setGeneratedCaptions(data.captions || []);
      toast.success('Captions generated!');
    } catch (error) {
      console.error('Error generating captions:', error);
      toast.error('Failed to generate captions. Please check if AI service is running.');
      setGeneratedCaptions([]);
    } finally {
      setGenerating(false);
    }
  };

  const generateHashtags = async () => {
    if (!content.trim()) {
      toast.error('Please add some content first');
      return;
    }

    setGenerating(true);
    try {
      // Call AI service to generate hashtags
      const response = await fetch('http://localhost:8001/api/content-tools/generate-hashtags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content })
      });

      if (!response.ok) throw new Error('Failed to generate hashtags');

      const data = await response.json();
      setGeneratedHashtags(data.hashtags || []);
      toast.success('Hashtags generated!');
    } catch (error) {
      console.error('Error generating hashtags:', error);
      toast.error('Failed to generate hashtags. Please check if AI service is running.');
      setGeneratedHashtags([]);
    } finally {
      setGenerating(false);
    }
  };

  const improveTone = async (tone: 'professional' | 'casual' | 'friendly') => {
    if (!content.trim()) {
      toast.error('Please add some content first');
      return;
    }

    setGenerating(true);
    try {
      const response = await fetch('http://localhost:8001/api/content-tools/improve-tone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, tone })
      });

      if (!response.ok) throw new Error('Failed to improve tone');

      const data = await response.json();
      if (onApplyCaption) {
        onApplyCaption(data.improvedContent);
      }
      toast.success(`Content improved with ${tone} tone!`);
    } catch (error) {
      console.error('Error improving tone:', error);
      toast.error('Failed to improve tone');
    } finally {
      setGenerating(false);
    }
  };

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
    toast.success('Copied to clipboard!');
  };

  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 bg-gradient-to-r from-[#FFB88C] via-[#FF6F91] to-[#6DE7C5] rounded-lg flex items-center justify-center">
          <Sparkles className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="font-semibold">AI Content Tools</h3>
          <p className="text-xs text-gray-600">Powered by Gemini AI</p>
        </div>
      </div>

      <Tabs defaultValue="captions" className="w-full">
        <TabsList className="w-full">
          <TabsTrigger value="captions" className="flex-1">
            <Type className="w-4 h-4 mr-2" />
            Captions
          </TabsTrigger>
          <TabsTrigger value="hashtags" className="flex-1">
            <Hash className="w-4 h-4 mr-2" />
            Hashtags
          </TabsTrigger>
          <TabsTrigger value="tone" className="flex-1">
            <Wand2 className="w-4 h-4 mr-2" />
            Tone
          </TabsTrigger>
        </TabsList>

        {/* Captions Tab */}
        <TabsContent value="captions" className="space-y-3">
          <Button
            onClick={generateCaptions}
            disabled={generating}
            className="w-full bg-gradient-to-r from-[#FFB88C] via-[#FF6F91] to-[#6DE7C5]"
            size="sm"
          >
            {generating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Generate Captions
              </>
            )}
          </Button>

          {generatedCaptions.length > 0 && (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {generatedCaptions.map((caption, index) => (
                <div
                  key={index}
                  className="p-3 border rounded-lg hover:bg-gray-50 cursor-pointer group relative"
                >
                  <p className="text-sm pr-16">{caption}</p>
                  <div className="absolute right-2 top-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7"
                      onClick={() => copyToClipboard(caption, index)}
                    >
                      {copiedIndex === index ? (
                        <Check className="w-4 h-4 text-green-600" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                    {onApplyCaption && (
                      <Button
                        size="sm"
                        className="h-7"
                        onClick={() => onApplyCaption(caption)}
                      >
                        Use
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Hashtags Tab */}
        <TabsContent value="hashtags" className="space-y-3">
          <Button
            onClick={generateHashtags}
            disabled={generating}
            className="w-full bg-gradient-to-r from-[#FFB88C] via-[#FF6F91] to-[#6DE7C5]"
            size="sm"
          >
            {generating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Hash className="w-4 h-4 mr-2" />
                Generate Hashtags
              </>
            )}
          </Button>

          {generatedHashtags.length > 0 && (
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2">
                {generatedHashtags.map((hashtag, index) => (
                  <Badge
                    key={index}
                    variant="secondary"
                    className="cursor-pointer hover:bg-gray-200"
                    onClick={() => copyToClipboard(hashtag, index + 100)}
                  >
                    {hashtag}
                  </Badge>
                ))}
              </div>
              
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    const allHashtags = generatedHashtags.join(' ');
                    copyToClipboard(allHashtags, 999);
                  }}
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Copy All
                </Button>
                {onApplyHashtags && (
                  <Button
                    size="sm"
                    className="flex-1"
                    onClick={() => onApplyHashtags(generatedHashtags)}
                  >
                    Add to Post
                  </Button>
                )}
              </div>
            </div>
          )}
        </TabsContent>

        {/* Tone Tab */}
        <TabsContent value="tone" className="space-y-2">
          <p className="text-xs text-gray-600 mb-2">
            Improve your content's tone with AI
          </p>
          
          <Button
            onClick={() => improveTone('professional')}
            disabled={generating}
            variant="outline"
            className="w-full justify-start"
            size="sm"
          >
            <Wand2 className="w-4 h-4 mr-2" />
            Make it Professional
          </Button>

          <Button
            onClick={() => improveTone('casual')}
            disabled={generating}
            variant="outline"
            className="w-full justify-start"
            size="sm"
          >
            <Wand2 className="w-4 h-4 mr-2" />
            Make it Casual
          </Button>

          <Button
            onClick={() => improveTone('friendly')}
            disabled={generating}
            variant="outline"
            className="w-full justify-start"
            size="sm"
          >
            <Wand2 className="w-4 h-4 mr-2" />
            Make it Friendly
          </Button>
        </TabsContent>
      </Tabs>
    </Card>
  );
}