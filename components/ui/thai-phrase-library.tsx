'use client';

import { useState } from 'react';
import { Button } from './button';
import { Input } from './input';
import { Label } from './label';
import { Plus, Save, Tag, X } from 'lucide-react';
import { Badge } from './badge';

interface Phrase {
  id: string;
  text: string;
  tags: string[];
}

interface ThaiPhraseLibraryProps {
  onSelect: (text: string) => void;
}

export function ThaiPhraseLibrary({ onSelect }: ThaiPhraseLibraryProps) {
  const [phrases, setPhrases] = useState<Phrase[]>([]);
  const [newPhrase, setNewPhrase] = useState('');
  const [newTag, setNewTag] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [currentTags, setCurrentTags] = useState<string[]>([]);

  const handleAddPhrase = () => {
    if (!newPhrase) return;
    
    const phrase: Phrase = {
      id: Date.now().toString(),
      text: newPhrase,
      tags: currentTags,
    };
    
    setPhrases([...phrases, phrase]);
    setNewPhrase('');
    setCurrentTags([]);
  };

  const handleAddTag = () => {
    if (!newTag || currentTags.includes(newTag)) return;
    setCurrentTags([...currentTags, newTag]);
    setNewTag('');
  };

  const handleRemoveTag = (tag: string) => {
    setCurrentTags(currentTags.filter(t => t !== tag));
  };

  const handleToggleFilter = (tag: string) => {
    setSelectedTags(
      selectedTags.includes(tag)
        ? selectedTags.filter(t => t !== tag)
        : [...selectedTags, tag]
    );
  };

  const filteredPhrases = phrases.filter(phrase =>
    selectedTags.length === 0 || selectedTags.some(tag => phrase.tags.includes(tag))
  );

  const allTags = Array.from(new Set(phrases.flatMap(p => p.tags)));

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>자주 쓰는 문구 추가</Label>
        <div className="flex gap-2">
          <Input
            value={newPhrase}
            onChange={(e) => setNewPhrase(e.target.value)}
            placeholder="자주 사용하는 태국어 문구를 입력하세요"
          />
          <Button onClick={handleAddPhrase}>
            <Plus className="h-4 w-4 mr-2" />
            추가
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        <Label>태그 추가</Label>
        <div className="flex gap-2">
          <Input
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            placeholder="태그를 입력하세요"
          />
          <Button variant="outline" onClick={handleAddTag}>
            <Tag className="h-4 w-4 mr-2" />
            태그 추가
          </Button>
        </div>
        {currentTags.length > 0 && (
          <div className="flex gap-2 mt-2">
            {currentTags.map(tag => (
              <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                {tag}
                <X
                  className="h-3 w-3 cursor-pointer"
                  onClick={() => handleRemoveTag(tag)}
                />
              </Badge>
            ))}
          </div>
        )}
      </div>

      {allTags.length > 0 && (
        <div className="space-y-2">
          <Label>태그로 필터링</Label>
          <div className="flex gap-2 flex-wrap">
            {allTags.map(tag => (
              <Badge
                key={tag}
                variant={selectedTags.includes(tag) ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => handleToggleFilter(tag)}
              >
                {tag}
              </Badge>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-2">
        <Label>저장된 문구</Label>
        <div className="space-y-2">
          {filteredPhrases.map(phrase => (
            <div
              key={phrase.id}
              className="p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
              onClick={() => onSelect(phrase.text)}
            >
              <p className="mb-2">{phrase.text}</p>
              <div className="flex gap-2">
                {phrase.tags.map(tag => (
                  <Badge key={tag} variant="secondary">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 