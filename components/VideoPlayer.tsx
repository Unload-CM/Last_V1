'use client';

import React, { useRef, useState, useEffect } from 'react';
import { FiPlay, FiPause, FiMaximize } from 'react-icons/fi';

interface VideoPlayerProps {
  src: string;
  type: string;
  caption?: string;
}

export default function VideoPlayer({ src, type, caption }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleError = () => {
      console.error('비디오 에러:', video.error);
      setError('비디오를 재생할 수 없습니다.');
    };

    video.addEventListener('error', handleError);
    return () => {
      video.removeEventListener('error', handleError);
    };
  }, []);

  const handlePlay = async () => {
    if (!videoRef.current) return;

    try {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        await videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    } catch (err) {
      console.error('비디오 재생 오류:', err);
      setError('비디오 재생 중 오류가 발생했습니다.');
    }
  };

  const handleFullscreen = () => {
    if (!videoRef.current) return;
    
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      videoRef.current.requestFullscreen();
    }
  };

  if (error) {
    return (
      <div className="rounded-lg bg-red-50 p-4">
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  return (
    <div className="relative group">
      <div className="relative bg-black rounded-lg overflow-hidden">
        <video
          ref={videoRef}
          className="w-full h-auto rounded-lg"
          controls
          controlsList="nodownload"
          playsInline
          preload="metadata"
        >
          <source src={src} type={type} />
          비디오를 재생할 수 없습니다.
        </video>
        
        <div className="absolute bottom-4 left-4 right-4 flex justify-between items-center opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={handlePlay}
            className="p-2 bg-white/90 rounded-full shadow-lg hover:bg-white"
          >
            {isPlaying ? <FiPause size={20} /> : <FiPlay size={20} />}
          </button>
          
          <button
            onClick={handleFullscreen}
            className="p-2 bg-white/90 rounded-full shadow-lg hover:bg-white"
          >
            <FiMaximize size={20} />
          </button>
        </div>
      </div>
      
      {caption && (
        <div className="mt-2 text-sm text-gray-600">{caption}</div>
      )}
    </div>
  );
} 