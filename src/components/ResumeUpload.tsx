import { useState, useRef } from "react";
import { Upload, Loader2, CheckCircle2, AlertCircle, FileText, Sparkles, TrendingUp } from "lucide-react";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";
import { Progress } from "./ui/progress";
import { toast } from "sonner@2.0.3";
import { db } from "../lib/firebase";
import { uploadDocument } from "../lib/cloudinary";
import { doc, updateDoc } from "firebase/firestore";
import { apiService } from "../lib/apiService";
import { useAuth } from "../hooks/useAuth";

interface ResumeAnalysisResult {
  ats_score: number;
  skills: string[];
  suggestions: string[];
}

export function ResumeUpload() {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [analysisResult, setAnalysisResult] = useState<ResumeAnalysisResult | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState<string>("");

  const validateFile = (file: File): { isValid: boolean; error?: string } => {
    // Check file type
    const allowedTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ];
    
    const allowedExtensions = [".pdf", ".doc", ".docx"];
    const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf("."));
    
    if (!allowedTypes.includes(file.type) && !allowedExtensions.includes(fileExtension)) {
      return {
        isValid: false,
        error: "Only PDF, DOC, and DOCX files are supported"
      };
    }

    // Check file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB in bytes
    if (file.size > maxSize) {
      return {
        isValid: false,
        error: "File size must be less than 5MB"
      };
    }

    return { isValid: true };
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = validateFile(file);
    if (!validation.isValid) {
      toast.error(validation.error || "Invalid file");
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      return;
    }

    setSelectedFile(file);
    setAnalysisResult(null); // Clear previous results
  };

  const handleUpload = async () => {
    if (!selectedFile || !user) {
      toast.error("Please select a file first");
      return;
    }

    setUploading(true);

    try {
      // 1. Upload to Cloudinary
      const uploadResult = await uploadDocument(selectedFile);
      const downloadURL = uploadResult.secure_url;

      // 2. Save resumeUrl to user document
      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, {
        resumeUrl: downloadURL,
        resumeFileName: selectedFile.name,
        resumeUploadedAt: new Date(),
      });

      // 3. Send to backend for analysis
      const formData = new FormData();
      formData.append("file", selectedFile);

      const response = await apiService.post<ResumeAnalysisResult>(
        "/career/resume/upload",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      setAnalysisResult(response.data);
      setUploadedFileName(selectedFile.name);
      toast.success("Resume uploaded and analyzed successfully!");

      // Clear file input
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error: any) {
      console.error("Resume upload error:", error);
      toast.error(error.response?.data?.error || error.message || "Failed to upload resume");
    } finally {
      setUploading(false);
    }
  };

  const getScoreColor = (score: number): string => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const getScoreBgColor = (score: number): string => {
    if (score >= 80) return "bg-green-100";
    if (score >= 60) return "bg-yellow-100";
    return "bg-red-100";
  };

  return (
    <div className="space-y-6">
      {/* Upload Section */}
      <Card>
        <CardContent className="p-6 space-y-4">
          <input
            type="file"
            ref={fileInputRef}
            accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            onChange={handleFileSelect}
            className="hidden"
          />

          <div
            className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-12 text-center hover:border-[#FF6F91]/50 transition-colors cursor-pointer"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="mb-2">
              {selectedFile ? selectedFile.name : "Upload Your Resume"}
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Supports PDF, DOC, DOCX (Max 5MB)
            </p>
            <Button
              className="bg-gradient-to-r from-[#FFB88C] via-[#FF6F91] to-[#6DE7C5] hover:opacity-90"
              disabled={uploading}
              onClick={(e) => {
                e.stopPropagation();
                fileInputRef.current?.click();
              }}
            >
              {selectedFile ? "Change File" : "Choose File"}
            </Button>
          </div>

          {selectedFile && (
            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-[#FF6F91]" />
                <div>
                  <p className="text-sm">{selectedFile.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {(selectedFile.size / 1024).toFixed(2)} KB
                  </p>
                </div>
              </div>
              <Button
                onClick={handleUpload}
                disabled={uploading}
                className="bg-gradient-to-r from-[#FFB88C] to-[#FF6F91] hover:opacity-90"
              >
                {uploading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Upload & Analyze
                  </>
                )}
              </Button>
            </div>
          )}

          <div className="bg-muted/50 rounded-lg p-4">
            <h4 className="text-sm mb-2 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#FF6F91]" />
              What You'll Get
            </h4>
            <ul className="text-sm text-muted-foreground space-y-1 ml-6">
              <li>• ATS (Applicant Tracking System) compatibility score</li>
              <li>• Extracted skills from your resume</li>
              <li>• 3 specific improvement suggestions</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Analysis Results */}
      {analysisResult && (
        <div className="space-y-4">
          {/* ATS Score Card */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="flex items-center gap-2 mb-1">
                    <TrendingUp className="w-5 h-5 text-[#FF6F91]" />
                    ATS Score
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Applicant Tracking System compatibility
                  </p>
                </div>
                <Badge
                  className={`text-2xl px-4 py-2 ${getScoreBgColor(analysisResult.ats_score)} ${getScoreColor(analysisResult.ats_score)}`}
                >
                  {analysisResult.ats_score}%
                </Badge>
              </div>
              <Progress value={analysisResult.ats_score} className="h-2" />
              <p className="text-xs text-muted-foreground mt-2">
                {analysisResult.ats_score >= 80
                  ? "Excellent! Your resume is well-optimized for ATS systems."
                  : analysisResult.ats_score >= 60
                  ? "Good, but there's room for improvement."
                  : "Your resume needs significant improvements for ATS compatibility."}
              </p>
            </CardContent>
          </Card>

          {/* Extracted Skills */}
          <Card>
            <CardContent className="p-6">
              <h3 className="flex items-center gap-2 mb-4">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
                Extracted Skills
              </h3>
              <div className="flex flex-wrap gap-2">
                {analysisResult.skills.length > 0 ? (
                  analysisResult.skills.map((skill, index) => (
                    <Badge
                      key={index}
                      variant="secondary"
                      className="bg-gradient-to-r from-[#FFB88C]/10 to-[#FF6F91]/10 text-[#FF6F91]"
                    >
                      {skill}
                    </Badge>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No specific skills detected. Consider adding a skills section to your resume.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Improvement Suggestions */}
          <Card>
            <CardContent className="p-6">
              <h3 className="flex items-center gap-2 mb-4">
                <AlertCircle className="w-5 h-5 text-[#FFB88C]" />
                Improvement Suggestions
              </h3>
              <div className="space-y-3">
                {analysisResult.suggestions.length > 0 ? (
                  analysisResult.suggestions.map((suggestion, index) => (
                    <div key={index} className="flex gap-3 p-3 bg-muted/50 rounded-lg">
                      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-gradient-to-r from-[#FFB88C] to-[#FF6F91] flex items-center justify-center text-white text-sm">
                        {index + 1}
                      </div>
                      <p className="text-sm text-muted-foreground">{suggestion}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Great job! No major issues detected.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Success Message */}
          <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
                <div>
                  <p className="text-sm">
                    Resume saved successfully!
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {uploadedFileName} is now stored in your profile
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
