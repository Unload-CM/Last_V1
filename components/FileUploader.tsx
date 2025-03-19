'use client';

import React, { useCallback, useState, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { FiUpload, FiCheckCircle, FiAlertCircle, FiImage, FiFile, FiX, FiVideo } from 'react-icons/fi';
import Image from 'next/image';

interface FileWithPreview extends File {
  preview?: string;
  progress?: number;
}

interface FileUploaderProps {
  onFilesSelected: (files: File[]) => void;
  maxFiles?: number;
  maxSize?: number;
  acceptedFileTypes?: string[];
  imageCompression?: {
    maxWidth: number;
    maxHeight: number;
    quality: number;
  };
  title?: string;
}

interface UploadStatus {
  status: 'idle' | 'uploading' | 'success' | 'error';
  progress: number;
  error?: string;
}

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, message }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4">
        <h3 className="text-lg font-semibold mb-2">{title}</h3>
        <p className="text-gray-600 mb-4">{message}</p>
        <button
          onClick={onClose}
          className="w-full bg-primary-600 text-white py-2 px-4 rounded hover:bg-primary-700 transition-colors"
        >
          확인
        </button>
      </div>
    </div>
  );
};

// 이미지 리사이징 함수
const resizeImage = async (file: File, maxWidth: number = 800, maxHeight: number = 800): Promise<Blob> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = document.createElement('img');
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // 비율 계산
        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);

        // 이미지 품질 조정 (0.8 = 80% 품질)
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            }
          },
          'image/jpeg',
          0.8
        );
      };
    };
  });
};

const FileUploader: React.FC<FileUploaderProps> = ({
  onFilesSelected,
  maxFiles = 5,
  maxSize = 10 * 1024 * 1024, // 10MB
  acceptedFileTypes = ['image/jpeg', 'image/png', 'image/gif', 'video/mp4', 'video/quicktime', 'video/x-msvideo'],
  imageCompression = {
    maxWidth: 1280,
    maxHeight: 720,
    quality: 0.8
  },
  title,
}) => {
  const [files, setFiles] = useState<FileWithPreview[]>([]);
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>({
    status: 'idle',
    progress: 0,
  });
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState({ title: '', message: '' });

  // 컴포넌트 언마운트 시 URL 객체 정리
  useEffect(() => {
    return () => {
      files.forEach(file => {
        if (file.preview) {
          URL.revokeObjectURL(file.preview);
        }
      });
    };
  }, [files]);

  // 이미지 압축 함수
  const compressImage = async (file: File): Promise<File> => {
    if (!file.type.startsWith('image/')) {
      return file;
    }

    return new Promise((resolve) => {
      // @ts-ignore
      const img = new Image();
      img.src = URL.createObjectURL(file);
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // 최대 크기에 맞게 비율 조정
        if (width > imageCompression.maxWidth) {
          height = (height * imageCompression.maxWidth) / width;
          width = imageCompression.maxWidth;
        }
        if (height > imageCompression.maxHeight) {
          width = (width * imageCompression.maxHeight) / height;
          height = imageCompression.maxHeight;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              const compressedFile = new File([blob], file.name, {
                type: file.type,
                lastModified: Date.now(),
              });
              resolve(compressedFile);
            } else {
              resolve(file);
            }
          },
          file.type,
          imageCompression.quality
        );
      };
    });
  };

  const simulateProgress = () => {
    return new Promise<void>((resolve) => {
      let progress = 0;
      const interval = setInterval(() => {
        progress += 5;
        setUploadStatus(prev => ({
          ...prev,
          status: 'uploading',
          progress,
        }));

        if (progress >= 100) {
          clearInterval(interval);
          setUploadStatus({
            status: 'success',
            progress: 100,
          });
          resolve();
        }
      }, 100);
    });
  };

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    try {
      if (acceptedFiles.length + files.length > maxFiles) {
        setError(`최대 ${maxFiles}개까지만 업로드할 수 있습니다.`);
        return;
      }

      const processedFiles: FileWithPreview[] = [];
      
      for (const file of acceptedFiles) {
        if (file.size > maxSize) {
          setError(`파일 크기는 ${maxSize / 1024 / 1024}MB 이하여야 합니다.`);
          continue;
        }
        if (!acceptedFileTypes.includes(file.type)) {
          setError(`지원하지 않는 파일 형식입니다: ${file.type}`);
          continue;
        }

        setUploadStatus({ status: 'uploading', progress: 0 });

        try {
          if (file.type.startsWith('image/')) {
            const resizedBlob = await resizeImage(file);
            const resizedFile = new File([resizedBlob], file.name, {
              type: 'image/jpeg',
              lastModified: Date.now(),
            }) as FileWithPreview;
            
            resizedFile.preview = URL.createObjectURL(resizedBlob);
            processedFiles.push(resizedFile);
            
            // 이미지 업로드 진행률 시뮬레이션
            await simulateProgress();
          } else if (file.type.startsWith('video/')) {
            const videoFile = file as FileWithPreview;
            videoFile.preview = URL.createObjectURL(file);
            processedFiles.push(videoFile);
            
            // 비디오 업로드 진행률 시뮬레이션
            await simulateProgress();
          }
        } catch (err) {
          console.error('파일 처리 중 오류:', err);
          setError('파일 처리 중 오류가 발생했습니다.');
          continue;
        }
      }

      if (processedFiles.length > 0) {
        const updatedFiles = [...files, ...processedFiles];
        setFiles(updatedFiles);
        onFilesSelected(updatedFiles);
        setError(null);
        
        setModalContent({
          title: '업로드 완료',
          message: `${processedFiles.length}개의 파일이 성공적으로 업로드되었습니다.`,
        });
        setIsModalOpen(true);
      }
    } catch (err) {
      console.error('파일 처리 중 오류:', err);
      setError('파일 처리 중 오류가 발생했습니다.');
      setUploadStatus({
        status: 'error',
        progress: 0,
        error: '파일 처리 중 오류가 발생했습니다.',
      });
    }
  }, [files, maxFiles, maxSize, acceptedFileTypes, onFilesSelected]);

  const removeFile = (index: number) => {
    const fileToRemove = files[index];
    if (fileToRemove.preview) {
      URL.revokeObjectURL(fileToRemove.preview);
    }
    const newFiles = files.filter((_, i) => i !== index);
    setFiles(newFiles);
    onFilesSelected(newFiles);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: acceptedFileTypes.reduce((acc, type) => ({ ...acc, [type]: [] }), {}),
    maxFiles,
    maxSize,
    multiple: true
  });

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) return <FiImage className="w-6 h-6" />;
    if (fileType.startsWith('video/')) return <FiVideo className="w-6 h-6" />;
    return <FiFile className="w-6 h-6" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="w-full">
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
          ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}`}
      >
        <input {...getInputProps()} />
        {isDragActive ? (
          <p className="text-blue-500">여기에 놓아주세요...</p>
        ) : (
          <div className="text-gray-500">
            <FiUpload className="mx-auto h-12 w-12 mb-2" />
            <p>
              사진이나 동영상을 이곳에 끌어다 놓거나<br />
              클릭하여 선택해주세요
            </p>
            <p className="text-sm mt-2">
              지원 형식: 사진(jpg, png, gif), 동영상(mp4, mov, avi)
            </p>
          </div>
        )}
      </div>

      {error && (
        <p className="mt-2 text-sm text-red-500">{error}</p>
      )}

      {uploadStatus.status === 'uploading' && (
        <div className="mt-4">
          <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
            <div
              className="bg-primary-600 h-2.5 rounded-full transition-all duration-300"
              style={{ width: `${uploadStatus.progress}%` }}
            />
          </div>
          <p className="text-xs text-gray-600 mt-1">업로드 중... {uploadStatus.progress}%</p>
        </div>
      )}

      {files.length > 0 && (
        <div className="mt-4 space-y-2">
          {files.map((file, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-2 bg-gray-50 rounded-lg"
            >
              <div className="flex items-center space-x-2">
                {file.type.startsWith('image/') ? (
                  <img
                    src={file.preview}
                    alt={file.name}
                    className="w-10 h-10 object-cover rounded"
                  />
                ) : (
                  <FiVideo className="w-10 h-10 text-gray-400" />
                )}
                <div>
                  <p className="text-sm font-medium text-gray-700">{file.name}</p>
                  <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => removeFile(index)}
                className="p-1 text-gray-500 hover:text-red-500"
              >
                <FiX />
              </button>
            </div>
          ))}
        </div>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={modalContent.title}
        message={modalContent.message}
      />
    </div>
  );
};

export default FileUploader; 