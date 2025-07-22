'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  Image, 
  Camera, 
  Upload,
  Play,
  Pause,
  Square,
  Download
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface VoiceMediaHandlerProps {
  onVoiceInput?: (transcript: string) => void;
  onImageUpload?: (imageData: string, metadata: any) => void;
  onScreenshot?: (imageData: string) => void;
  className?: string;
}

export function VoiceMediaHandler({
  onVoiceInput,
  onImageUpload,
  onScreenshot,
  className
}: VoiceMediaHandlerProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [transcript, setTranscript] = useState('');
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Initialize audio context for voice level monitoring
  useEffect(() => {
    if (typeof window !== 'undefined' && 'AudioContext' in window) {
      audioContextRef.current = new AudioContext();
    }
    
    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  const startVoiceRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Set up audio level monitoring
      if (audioContextRef.current) {
        const source = audioContextRef.current.createMediaStreamSource(stream);
        analyserRef.current = audioContextRef.current.createAnalyser();
        source.connect(analyserRef.current);
        
        const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
        
        const updateAudioLevel = () => {
          if (analyserRef.current && isRecording) {
            analyserRef.current.getByteFrequencyData(dataArray);
            const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
            setAudioLevel(average);
            requestAnimationFrame(updateAudioLevel);
          }
        };
        
        updateAudioLevel();
      }
      
      // Set up media recorder
      mediaRecorderRef.current = new MediaRecorder(stream);
      const audioChunks: Blob[] = [];
      
      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunks.push(event.data);
      };
      
      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
        
        // TODO: Implement speech-to-text conversion
        // For now, we'll simulate with a placeholder
        const mockTranscript = 'Voice input detected - speech-to-text integration needed';
        setTranscript(mockTranscript);
        
        if (onVoiceInput) {
          onVoiceInput(mockTranscript);
        }
        
        // Clean up
        stream.getTracks().forEach(track => track.stop());
      };
      
      mediaRecorderRef.current.start();
      setIsRecording(true);
      toast.success('Voice recording started');
      
    } catch (error) {
      console.error('Error starting voice recording:', error);
      toast.error('Failed to start voice recording');
    }
  }, [isRecording, onVoiceInput]);

  const stopVoiceRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setAudioLevel(0);
      toast.success('Voice recording stopped');
    }
  }, [isRecording]);

  const handleImageUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const imageData = e.target?.result as string;
      const metadata = {
        name: file.name,
        size: file.size,
        type: file.type,
        lastModified: file.lastModified
      };
      
      if (onImageUpload) {
        onImageUpload(imageData, metadata);
      }
      
      toast.success('Image uploaded successfully');
    };
    
    reader.readAsDataURL(file);
  }, [onImageUpload]);

  const takeScreenshot = useCallback(async () => {
    try {
      // TODO: Implement screen capture API
      // For now, we'll simulate with a placeholder
      const mockScreenshot = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
      
      if (onScreenshot) {
        onScreenshot(mockScreenshot);
      }
      
      toast.success('Screenshot captured');
    } catch (error) {
      console.error('Error taking screenshot:', error);
      toast.error('Failed to capture screenshot');
    }
  }, [onScreenshot]);

  const playTextToSpeech = useCallback(async (text: string) => {
    if (!('speechSynthesis' in window)) {
      toast.error('Text-to-speech not supported');
      return;
    }
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.onstart = () => setIsPlaying(true);
    utterance.onend = () => setIsPlaying(false);
    utterance.onerror = () => {
      setIsPlaying(false);
      toast.error('Text-to-speech failed');
    };
    
    speechSynthesis.speak(utterance);
    toast.success('Playing text-to-speech');
  }, []);

  const stopTextToSpeech = useCallback(() => {
    if ('speechSynthesis' in window) {
      speechSynthesis.cancel();
      setIsPlaying(false);
      toast.success('Text-to-speech stopped');
    }
  }, []);

  return (
    <Card className={cn("", className)}>
      <CardHeader>
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Volume2 className="w-4 h-4" />
          Voice & Media Controls
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Voice Recording */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Voice Input</span>
            <Badge variant={isRecording ? "destructive" : "secondary"} className="text-xs">
              {isRecording ? 'Recording' : 'Ready'}
            </Badge>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant={isRecording ? "destructive" : "outline"}
              size="sm"
              onClick={isRecording ? stopVoiceRecording : startVoiceRecording}
            >
              {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </Button>
            
            {isRecording && (
              <div className="flex-1">
                <Progress value={audioLevel} className="h-2" />
              </div>
            )}
          </div>
          
          {transcript && (
            <div className="text-xs bg-muted rounded p-2">
              <strong>Transcript:</strong> {transcript}
            </div>
          )}
        </div>

        {/* Text-to-Speech */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Voice Output</span>
            <Badge variant={isPlaying ? "default" : "secondary"} className="text-xs">
              {isPlaying ? 'Playing' : 'Ready'}
            </Badge>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => playTextToSpeech('Hello! This is a test of the text-to-speech functionality.')}
              disabled={isPlaying}
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={stopTextToSpeech}
              disabled={!isPlaying}
            >
              <Square className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Image Upload */}
        <div className="space-y-2">
          <span className="text-sm font-medium">Image Upload</span>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="w-4 h-4 mr-1" />
              Upload
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={takeScreenshot}
            >
              <Camera className="w-4 h-4 mr-1" />
              Screenshot
            </Button>
          </div>
          
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
          />
        </div>

        {/* Feature Status */}
        <div className="space-y-2">
          <span className="text-sm font-medium">Feature Status</span>
          
          <div className="space-y-1 text-xs">
            <div className="flex justify-between">
              <span>Speech-to-Text:</span>
              <Badge variant="outline" className="text-xs">Placeholder</Badge>
            </div>
            <div className="flex justify-between">
              <span>Text-to-Speech:</span>
              <Badge variant="secondary" className="text-xs">Available</Badge>
            </div>
            <div className="flex justify-between">
              <span>Image Upload:</span>
              <Badge variant="secondary" className="text-xs">Available</Badge>
            </div>
            <div className="flex justify-between">
              <span>Screen Capture:</span>
              <Badge variant="outline" className="text-xs">Placeholder</Badge>
            </div>
          </div>
        </div>

        {/* Integration Notes */}
        <div className="text-xs text-muted-foreground bg-muted/50 rounded p-2">
          <strong>Integration Notes:</strong>
          <ul className="mt-1 space-y-1 list-disc list-inside">
            <li>Speech-to-text requires API integration (OpenAI Whisper, Google Speech-to-Text)</li>
            <li>Screen capture needs Screen Capture API implementation</li>
            <li>Image analysis can be integrated with vision models</li>
            <li>Voice commands can trigger AI agent workflows</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
