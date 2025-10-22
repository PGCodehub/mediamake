"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2, Play, Download, Trash2, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { useTranscriber } from "../contexts/transcriber-context";
import { VideoGeneration } from "@/app/types/transcription";
import {
  HeyGenAvatar,
  POPULAR_AVATARS,
  AVATAR_STYLES,
  BACKGROUND_TYPES,
  VIDEO_RESOLUTIONS,
  DEFAULT_COLORS,
  DEFAULT_CONFIG,
} from "./heygen-config";

export function HeyGenUI() {
  const { transcriptionData, refreshTranscription } = useTranscriber();
  
  // Avatar state
  const [availableAvatars, setAvailableAvatars] = useState<HeyGenAvatar[]>(POPULAR_AVATARS);
  const [isLoadingAvatars, setIsLoadingAvatars] = useState(false);
  
  // Configuration state
  const [avatarId, setAvatarId] = useState(DEFAULT_CONFIG.avatarId);
  const [avatarStyle, setAvatarStyle] = useState(DEFAULT_CONFIG.avatarStyle);
  const [resolution, setResolution] = useState(DEFAULT_CONFIG.resolution);
  const [backgroundType, setBackgroundType] = useState<'color' | 'image'>(DEFAULT_CONFIG.background.type);
  const [backgroundColor, setBackgroundColor] = useState(DEFAULT_CONFIG.background.value);
  const [backgroundImage, setBackgroundImage] = useState('');
  
  // Generation state
  const [isGenerating, setIsGenerating] = useState(false);
  const [pollingVideoId, setPollingVideoId] = useState<string | null>(null);
  
  // Filter state
  const [genderFilter, setGenderFilter] = useState<'all' | 'male' | 'female'>('all');
  const [showOnlyFree, setShowOnlyFree] = useState(false);
  
  // Fetch avatars function (memoized to prevent recreating on every render)
  const fetchAvatars = useCallback(async (showToast = true) => {
    setIsLoadingAvatars(true);
    try {
      const response = await fetch('/api/video/heygen/avatars');
      if (response.ok) {
        const data = await response.json();
        if (data.avatars && data.avatars.length > 0) {
          // Map HeyGen avatar format to our format
          const mappedAvatars: HeyGenAvatar[] = data.avatars.map((avatar: any) => ({
            id: avatar.avatar_id,
            name: avatar.avatar_name || avatar.avatar_id,
            gender: avatar.gender || 'female',
            style: 'professional',
            preview_image_url: avatar.preview_image_url,
            isPremium: avatar.is_premium || avatar.isPremium || false,
            tier: avatar.tier || (avatar.is_premium ? 'premium' : 'free'),
          }));
          setAvailableAvatars(mappedAvatars);
          
          // Cache the avatars
          localStorage.setItem('heygen_avatars', JSON.stringify(mappedAvatars));
          localStorage.setItem('heygen_avatars_timestamp', Date.now().toString());
          
          // Set first avatar as default if none selected
          if (!avatarId && mappedAvatars.length > 0) {
            setAvatarId(mappedAvatars[0].id);
          }
          
          if (showToast) {
            toast.success(`Loaded ${mappedAvatars.length} avatars`);
          }
        }
      } else {
        const error = await response.json();
        if (showToast) {
          toast.error(error.error || 'Failed to fetch avatars');
        }
      }
    } catch (error) {
      console.error('Error fetching avatars:', error);
      if (showToast) {
        toast.error('Failed to fetch avatars');
      }
    } finally {
      setIsLoadingAvatars(false);
    }
  }, [avatarId]); // Only recreate if avatarId changes
  
  // Fetch avatars on mount only if not cached
  useEffect(() => {
    // Check if we have cached avatars
    const cachedAvatars = localStorage.getItem('heygen_avatars');
    const cacheTimestamp = localStorage.getItem('heygen_avatars_timestamp');
    
    if (cachedAvatars && cacheTimestamp) {
      const age = Date.now() - parseInt(cacheTimestamp);
      const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days
      
      // Use cache if less than 7 days old
      if (age < maxAge) {
        try {
          const parsed = JSON.parse(cachedAvatars);
          if (parsed && parsed.length > 0) {
            setAvailableAvatars(parsed);
            // Set first avatar as default if none selected
            if (!avatarId && parsed.length > 0) {
              setAvatarId(parsed[0].id);
            }
            console.log(`Loaded ${parsed.length} avatars from cache`);
            return; // Don't fetch from API
          }
        } catch (e) {
          console.error('Failed to parse cached avatars:', e);
        }
      }
    }
    
    // No cache or expired, fetch from API
    fetchAvatars(false); // Don't show toast on initial load
  }, [fetchAvatars, avatarId]);
  
  // Get filtered avatars
  const filteredAvatars = availableAvatars.filter(avatar => {
    const matchesGender = genderFilter === 'all' || avatar.gender === genderFilter;
    const matchesTier = !showOnlyFree || !avatar.isPremium;
    return matchesGender && matchesTier;
  });
  
  // Helper to get avatar by ID
  const getAvatarById = (id: string) => availableAvatars.find(a => a.id === id);
  
  // Get HeyGen videos from transcription
  const heygenVideos = transcriptionData?.videos?.filter(v => v.provider === 'heygen') || [];
  
  // Poll for video status (as fallback for webhook or if webhook disabled)
  useEffect(() => {
    if (!pollingVideoId) return;
    
    console.log('Starting polling for video:', pollingVideoId);
    
    // Poll function
    const pollStatus = async () => {
      try {
        console.log('Polling video status for:', pollingVideoId);
        const response = await fetch(`/api/video/heygen/status?videoId=${pollingVideoId}`);
        if (response.ok) {
          const data = await response.json();
          console.log('Poll result:', data);
          
          if (data.status === 'completed') {
            toast.success('Video generated successfully!');
            setPollingVideoId(null);
            setIsGenerating(false);
            if (refreshTranscription) {
              await refreshTranscription();
            }
            return true; // Stop polling
          } else if (data.status === 'failed') {
            toast.error(data.error || 'Video generation failed');
            setPollingVideoId(null);
            setIsGenerating(false);
            return true; // Stop polling
          }
        }
        return false; // Continue polling
      } catch (error) {
        console.error('Error polling video status:', error);
        return false; // Continue polling
      }
    };
    
    // Poll immediately first time
    pollStatus();
    
    // Then poll every 10 seconds
    const pollInterval = setInterval(async () => {
      const shouldStop = await pollStatus();
      if (shouldStop) {
        clearInterval(pollInterval);
      }
    }, 10000); // Poll every 10 seconds
    
    return () => {
      console.log('Stopping polling for video:', pollingVideoId);
      clearInterval(pollInterval);
    };
  }, [pollingVideoId]);
  
  const handleGenerate = async () => {
    if (!transcriptionData?._id) {
      toast.error('No transcription selected');
      return;
    }
    
    if (!transcriptionData.audioUrl) {
      toast.error('No audio URL found in transcription');
      return;
    }
    
    setIsGenerating(true);
    
    try {
      const response = await fetch('/api/video/heygen/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transcriptionId: transcriptionData._id.toString(),
          avatarId,
          avatarStyle,
          resolution,
          background: {
            type: backgroundType,
            value: backgroundType === 'color' ? backgroundColor : backgroundImage,
          },
        }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to generate video');
      }
      
      const data = await response.json();
      
      if (data.videoId) {
        if (data.webhookConfigured) {
          toast.success('Video generation started! You\'ll be notified when complete.');
          // Still poll but less frequently when webhook is enabled
          setPollingVideoId(data.videoId);
        } else {
          toast.success('Video generation started! This may take a few minutes...');
          setPollingVideoId(data.videoId);
        }
      } else {
        throw new Error('No video ID returned');
      }
    } catch (error: any) {
      console.error('Error generating video:', error);
      
      // Check if it's an avatar not found error
      const errorMessage = error.message || 'Failed to generate video';
      if (errorMessage.includes('avatar_not_found') || errorMessage.includes('not found or no longer available')) {
        toast.error('Avatar not available. Refreshing avatar list...');
        // Auto-refresh avatars on avatar error
        await fetchAvatars(false);
      } else {
        toast.error(errorMessage);
      }
      
      setIsGenerating(false);
    }
  };
  
  const handleDelete = async (videoId: string) => {
    if (!transcriptionData?._id) return;
    
    try {
      const updatedVideos = transcriptionData.videos?.filter(v => v.id !== videoId) || [];
      
      const response = await fetch(`/api/transcriptions/${transcriptionData._id.toString()}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          videos: updatedVideos,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete video');
      }
      
      toast.success('Video deleted');
      if (refreshTranscription) {
        await refreshTranscription();
      }
    } catch (error) {
      console.error('Error deleting video:', error);
      toast.error('Failed to delete video');
    }
  };
  
  const selectedAvatar = getAvatarById(avatarId);

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      <div className="p-4 space-y-6">
        {/* Configuration Section */}
        <Card>
          <CardHeader>
            <CardTitle>Video Configuration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Avatar Selection */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Avatar</Label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => fetchAvatars(true)}
                  disabled={isLoadingAvatars}
                  title="Refresh avatar list from HeyGen"
                >
                  {isLoadingAvatars ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4" />
                  )}
                  <span className="ml-2">Refresh</span>
                </Button>
              </div>
              <div className="flex gap-2 mb-2">
                <Button
                  variant={genderFilter === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setGenderFilter('all')}
                >
                  All ({availableAvatars.length})
                </Button>
                <Button
                  variant={genderFilter === 'male' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setGenderFilter('male')}
                >
                  Male ({availableAvatars.filter(a => a.gender === 'male').length})
                </Button>
                <Button
                  variant={genderFilter === 'female' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setGenderFilter('female')}
                >
                  Female ({availableAvatars.filter(a => a.gender === 'female').length})
                </Button>
              </div>
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <span className="text-green-600">✓ {availableAvatars.filter(a => !a.isPremium).length} Free</span>
                  <span className="text-amber-600">★ {availableAvatars.filter(a => a.isPremium).length} Premium</span>
                </div>
                <Button
                  variant={showOnlyFree ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setShowOnlyFree(!showOnlyFree)}
                  className="h-7 text-xs"
                >
                  {showOnlyFree ? '✓ Free Only' : 'Show All'}
                </Button>
              </div>
              <Select value={avatarId} onValueChange={setAvatarId} disabled={isLoadingAvatars}>
                <SelectTrigger>
                  <SelectValue placeholder={isLoadingAvatars ? "Loading avatars..." : "Select an avatar"} />
                </SelectTrigger>
                <SelectContent>
                  {filteredAvatars.length === 0 ? (
                    <div className="p-2 text-sm text-muted-foreground">
                      No avatars found. Click Refresh to fetch available avatars.
                    </div>
                  ) : (
                    filteredAvatars.map(avatar => (
                      <SelectItem key={avatar.id} value={avatar.id}>
                        <div className="flex items-center justify-between w-full gap-2">
                          <span>{avatar.name}</span>
                          {avatar.isPremium && (
                            <span className="text-xs text-amber-600">★ Premium</span>
                          )}
                        </div>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              {selectedAvatar && (
                <div className="flex flex-wrap gap-2 mt-2">
                  <Badge variant="outline">{selectedAvatar.gender}</Badge>
                  <Badge variant="outline">{selectedAvatar.style}</Badge>
                  {selectedAvatar.isPremium ? (
                    <Badge variant="default" className="bg-amber-600 hover:bg-amber-700">
                      ★ Premium Only
                    </Badge>
                  ) : (
                    <Badge variant="default" className="bg-green-600 hover:bg-green-700">
                      ✓ Free Tier
                    </Badge>
                  )}
                </div>
              )}
              {selectedAvatar?.isPremium && (
                <p className="text-xs text-amber-600 mt-2">
                  ⚠️ This avatar requires a paid HeyGen subscription
                </p>
              )}
            </div>
            
            {/* Avatar Style */}
            <div className="space-y-2">
              <Label>Avatar Style</Label>
              <Select value={avatarStyle} onValueChange={setAvatarStyle}>
                <SelectTrigger>
                  <SelectValue placeholder="Select avatar style" />
                </SelectTrigger>
                <SelectContent>
                  {AVATAR_STYLES.map(style => (
                    <SelectItem key={style.value} value={style.value}>
                      {style.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {/* Video Resolution */}
            <div className="space-y-2">
              <Label>Video Resolution</Label>
              <Select value={resolution} onValueChange={setResolution}>
                <SelectTrigger>
                  <SelectValue placeholder="Select resolution" />
                </SelectTrigger>
                <SelectContent>
                  {VIDEO_RESOLUTIONS.map(res => (
                    <SelectItem key={res.value} value={res.value}>
                      <div className="flex flex-col">
                        <span>{res.label}</span>
                        <span className="text-xs text-muted-foreground">{res.description}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {resolution === '720p' ? (
                <p className="text-xs text-blue-600">
                  ℹ️ Free tier: 10 API credits/month, includes watermark
                </p>
              ) : (
                <p className="text-xs text-amber-600">
                  ⚠️ Higher resolutions require a HeyGen paid subscription
                </p>
              )}
            </div>
            
            {/* Background */}
            <div className="space-y-2">
              <Label>Background Type</Label>
              <Select 
                value={backgroundType} 
                onValueChange={(value: 'color' | 'image') => setBackgroundType(value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select background type" />
                </SelectTrigger>
                <SelectContent>
                  {BACKGROUND_TYPES.map(type => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {backgroundType === 'color' ? (
              <div className="space-y-2">
                <Label>Background Color</Label>
                <div className="flex gap-2">
                  <Input
                    type="color"
                    value={backgroundColor}
                    onChange={(e) => setBackgroundColor(e.target.value)}
                    className="w-20 h-10"
                  />
                  <Input
                    type="text"
                    value={backgroundColor}
                    onChange={(e) => setBackgroundColor(e.target.value)}
                    placeholder="#008000"
                    className="flex-1"
                  />
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {DEFAULT_COLORS.map(color => (
                    <button
                      key={color}
                      className="w-8 h-8 rounded border-2 border-gray-300 hover:border-gray-500"
                      style={{ backgroundColor: color }}
                      onClick={() => setBackgroundColor(color)}
                      title={color}
                    />
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <Label>Background Image URL</Label>
                <Input
                  type="url"
                  value={backgroundImage}
                  onChange={(e) => setBackgroundImage(e.target.value)}
                  placeholder="https://example.com/background.jpg"
                />
              </div>
            )}
            
            {/* Audio Info */}
            {transcriptionData?.audioUrl && (
              <div className="space-y-2">
                <Label>Audio Source</Label>
                <div className="text-sm text-muted-foreground bg-muted p-2 rounded break-all">
                  {transcriptionData.audioUrl}
                </div>
              </div>
            )}
            
            {/* Generate Button */}
            <Button
              className="w-full"
              onClick={handleGenerate}
              disabled={isGenerating || !transcriptionData?.audioUrl || !avatarId}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating Video...
                </>
              ) : (
                <>
                  <Play className="mr-2 h-4 w-4" />
                  Generate Video
                </>
              )}
            </Button>
            {!avatarId && (
              <p className="text-xs text-amber-600 text-center">
                ⚠️ Please select an avatar first. Click "Refresh" to load avatars.
              </p>
            )}
          </CardContent>
        </Card>
        
        {/* Generated Videos Section */}
        {heygenVideos.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Generated Videos ({heygenVideos.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <div className="space-y-4">
                  {heygenVideos.map((video) => (
                    <Card key={video.id}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center gap-2">
                              <Badge
                                variant={
                                  video.status === 'completed'
                                    ? 'default'
                                    : video.status === 'processing'
                                    ? 'secondary'
                                    : 'destructive'
                                }
                              >
                                {video.status}
                              </Badge>
                              <span className="text-sm text-muted-foreground">
                                {new Date(video.createdAt).toLocaleString()}
                              </span>
                            </div>
                            
                            <div className="text-sm">
                              <p>Avatar: {getAvatarById(video.config.avatarId || '')?.name || video.config.avatarId}</p>
                              <p>Style: {video.config.avatarStyle}</p>
                              {video.config.resolution && <p>Resolution: {video.config.resolution}</p>}
                              <p>Background: {video.config.background?.type} - {video.config.background?.value}</p>
                            </div>
                            
                            {video.status === 'completed' && video.videoUrl && (
                              <div className="mt-2">
                                <video
                                  src={video.videoUrl}
                                  controls
                                  className="w-full max-w-md rounded border"
                                />
                              </div>
                            )}
                            
                            {video.status === 'failed' && video.error && (
                              <p className="text-sm text-red-500">{video.error}</p>
                            )}
                          </div>
                          
                          <div className="flex gap-2">
                            {video.status === 'completed' && video.videoUrl && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => window.open(video.videoUrl, '_blank')}
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                            )}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDelete(video.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

