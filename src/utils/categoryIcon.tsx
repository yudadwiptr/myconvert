import React from 'react';
import { Archive, Code2, FileText, Film, Image as ImageIcon, Music, Presentation, Table } from 'lucide-react';
import { FormatCategory } from '../types/converter';

export function CategoryIcon({ category, className = 'w-4 h-4' }: { category: FormatCategory; className?: string }) {
  switch (category) {
    case 'spreadsheet':
      return <Table className={className} />;
    case 'presentation':
      return <Presentation className={className} />;
    case 'image':
      return <ImageIcon className={className} />;
    case 'audio':
      return <Music className={className} />;
    case 'video':
      return <Film className={className} />;
    case 'data':
      return <Code2 className={className} />;
    case 'archive':
      return <Archive className={className} />;
    case 'document':
    default:
      return <FileText className={className} />;
  }
}
