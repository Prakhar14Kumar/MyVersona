import { useState, useRef } from 'react';
import { Upload, Video, X, Loader2 } from 'lucide-react';
import { Button } from './ui/button';
import { Progress } from './ui/progress';
import { toast } from 'sonner';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { storage } from '../lib/firebase';
import { uploadVideo as uploadCloudinaryVideo } from '../lib/cloudinary';

interface VideoUploadProps {
  onVideoUploaded?: (videoUrl: string, thumbnailUrl: string, duration: number) => void;
  onUpload?: (videoUrl: string, thumbnailUrl: string) => void;
  onCancel?: () => void;
  maxSize?: number; // in MB
  maxDuration?: number; // in seconds
  isReel?: boolean;
}

export function VideoUpload({ 
  onVideoUploaded, 
  onUpload,
  onCancel,
  maxSize = 100, 
  maxDuration = 180,
  isReel = false 
}: VideoUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const generateThumbnail = (videoElement: HTMLVideoElement): Promise<string> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      canvas.width = videoElement.videoWidth;
      canvas.height = videoElement.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
        canvas.toBlob((blob) => {
          if (blob) {
            const thumbnailUrl = URL.createObjectURL(blob);
            resolve(thumbnailUrl);
          }
        }, 'image/jpeg', 0.8);
      }
    });
  };

  const handleVideoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('video/')) {
      toast.error('Please select a valid video file');
      return;
    }

    // Validate file size
    if (file.size > maxSize * 1024 * 1024) {
      toast.error(`Video size must be less than ${maxSize}MB`);
      return;
    }

    // Create preview and validate duration
    const videoUrl = URL.createObjectURL(file);
    const video = document.createElement('video');
    video.preload = 'metadata';
    
    video.onloadedmetadata = () => {
      if (video.duration > maxDuration) {
        toast.error(`Video duration must be less than ${Math.floor(maxDuration / 60)} minutes`);
        URL.revokeObjectURL(videoUrl);
        return;
      }

      if (isReel && video.duration > 60) {
        toast.error('Reels must be 60 seconds or less');
        URL.revokeObjectURL(videoUrl);
        return;
      }

      setVideoFile(file);
      setVideoPreview(videoUrl);
    };

    video.src = videoUrl;
  };

  const uploadVideo = async () => {
    if (!videoFile || !videoPreview) return;

    try {
      setUploading(true);
      setUploadProgress(20); // Fake progress for REST API start
      
      const uploadResult = await uploadCloudinaryVideo(videoFile);
      setUploadProgress(80);
      
      const videoUrl = uploadResult.secure_url;
      // Cloudinary automatically generates thumbnails by changing the extension to .jpg
      const thumbnailUrl = videoUrl.replace(/\.[^/.]+$/, ".jpg");
      
      const video = videoRef.current;
      const duration = video ? video.duration : 0;
      
      setUploadProgress(100);
      
      onVideoUploaded?.(videoUrl, thumbnailUrl, duration);
      onUpload?.(videoUrl, thumbnailUrl);
      toast.success('Video uploaded successfully!');
      resetUpload();
      
      setUploading(false);
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload video');
      setUploading(false);
    }
  };

  const resetUpload = () => {
    setVideoFile(null);
    setVideoPreview(null);
    setUploadProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-4">
      {!videoPreview ? (
        <div
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-[#FF6F91] transition-colors"
        >
          <Video className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <p className="mb-2">Click to upload {isReel ? 'reel' : 'video'}</p>
          <p className="text-sm text-gray-500">
            Max {maxSize}MB, {isReel ? '60 seconds' : `${Math.floor(maxDuration / 60)} minutes`}
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept="video/*"
            onChange={handleVideoSelect}
            className="hidden"
          />
        </div>
      ) : (
        <div className="space-y-4">
          <div className="relative bg-black rounded-lg overflow-hidden">
            <video
              ref={videoRef}
              src={videoPreview}
              controls
              className="w-full max-h-96"
            />
            <Button
              size="icon"
              variant="destructive"
              className="absolute top-2 right-2"
              onClick={resetUpload}
              disabled={uploading}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          {uploading && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Uploading...</span>
                <span>{Math.round(uploadProgress)}%</span>
              </div>
              <Progress value={uploadProgress} />
            </div>
          )}

          {!uploading && (
            <Button
              onClick={uploadVideo}
              className="w-full bg-gradient-to-r from-[#FFB88C] via-[#FF6F91] to-[#6DE7C5]"
            >
              <Upload className="w-4 h-4 mr-2" />
              Upload {isReel ? 'Reel' : 'Video'}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}