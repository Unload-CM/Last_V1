import useTranslation from "@/utils/i18n";
import { Button } from "@/components/ui/button";
import { FiEdit2, FiTrash } from 'react-icons/fi';

interface ItemTableProps {
  items: any[];
  type: 'department' | 'category' | 'status' | 'priority';
  onEdit: (item: any) => void;
  onDelete: (id: number) => void;
}

export default function ItemTable({ 
  items, 
  type, 
  onEdit, 
  onDelete 
}: ItemTableProps) {
  const { t } = useTranslation();
  
  // 항목 데이터 포맷팅
  const formattedItems = items.map((item: any) => ({
    id: item.id,
    key_value: item.name || '',
    label: item.label || item.name || '',
    description: item.description || ''
  }));

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-gray-50 text-left">
            <th className="px-4 py-2 border-b">라벨</th>
            <th className="px-4 py-2 border-b">코드</th>
            <th className="px-4 py-2 border-b">설명</th>
            <th className="px-4 py-2 border-b text-right">작업</th>
          </tr>
        </thead>
        <tbody>
          {formattedItems.map((item) => (
            <tr key={item.id} className="border-b hover:bg-gray-50">
              <td className="px-4 py-2">{item.label}</td>
              <td className="px-4 py-2 text-gray-600">{item.key_value}</td>
              <td className="px-4 py-2">{item.description}</td>
              <td className="px-4 py-2 text-right">
                <div className="flex justify-end space-x-2">
                  <Button
                    onClick={() => onEdit(item)}
                    className="h-8 px-3 text-xs bg-blue-100 text-blue-700 hover:bg-blue-200"
                  >
                    <FiEdit2 className="mr-1" size={14} />
                    {t('common.edit')}
                  </Button>
                  <Button
                    onClick={() => onDelete(item.id)}
                    className="h-8 px-3 text-xs bg-red-100 text-red-700 hover:bg-red-200"
                  >
                    <FiTrash className="mr-1" size={14} />
                    {t('common.delete')}
                  </Button>
                </div>
              </td>
            </tr>
          ))}
          
          {formattedItems.length === 0 && (
            <tr>
              <td colSpan={4} className="px-4 py-8 text-center text-gray-500">
                데이터가 없습니다.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
} 