import React, { useEffect, useState } from 'react';
import { useRecoilState } from 'recoil';
import { categoryState, selectedCategoryState } from '@/store/categoryState';
import { convertToEnglishKey, addTranslation } from '@/lib/i18n/translations';
import { Form, Input, Table, message, Modal, Button } from 'antd';
import type { FormInstance } from 'antd';
import { EditOutlined, DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import type { ButtonProps } from 'antd';

interface CategoryFormData {
  name: string;
  description?: string;
}

interface CategoryData {
  id: number;
  name: string;
  label: string;
  description: string | null;
}

interface CustomButtonProps extends ButtonProps {
  onClick: () => void | Promise<void>;
}

const EditButton: React.FC<CustomButtonProps> = ({ onClick, ...props }) => (
  <Button onClick={onClick} icon={<EditOutlined />} {...props}>
    수정
  </Button>
);

const DeleteButton: React.FC<CustomButtonProps> = ({ onClick, ...props }) => (
  <Button onClick={onClick} danger icon={<DeleteOutlined />} {...props}>
    삭제
  </Button>
);

const AddButton: React.FC<CustomButtonProps> = ({ onClick, ...props }) => (
  <Button onClick={onClick} type="primary" icon={<PlusOutlined />} {...props}>
    새 카테고리 추가
  </Button>
);

export default function CategoryManagement() {
  const [categories, setCategories] = useRecoilState(categoryState);
  const [selectedCategory, setSelectedCategory] = useRecoilState(selectedCategoryState);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm<CategoryFormData>();

  // 카테고리 목록 조회
  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/category');
      const data = await response.json();
      if (data.success) {
        setCategories(data.categories);
      } else {
        message.error(data.error || '카테고리 목록 조회에 실패했습니다.');
      }
    } catch (error) {
      console.error('카테고리 조회 중 오류:', error);
      message.error('카테고리 목록을 불러오는데 실패했습니다.');
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const showModal = (category?: any) => {
    if (category) {
      setSelectedCategory(category);
      form.setFieldsValue({
        name: category.label,
        description: category.description
      });
    } else {
      setSelectedCategory(null);
      form.resetFields();
    }
    setIsModalOpen(true);
  };

  const handleCancel = () => {
    setIsModalOpen(false);
    setSelectedCategory(null);
    form.resetFields();
  };

  // 카테고리 생성/수정
  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      console.log('폼 입력값:', values);

      if (!values.name || values.name.trim() === '') {
        throw new Error('카테고리 이름을 입력해주세요.');
      }

      // 요청 데이터 구성
      const requestData = {
        name: values.name,
        description: values.description || null
      };

      if (selectedCategory) {
        requestData['id'] = selectedCategory.id;
      }

      console.log('전송할 데이터:', requestData);

      // 카테고리 생성/수정
      const response = await fetch('/api/category', {
        method: selectedCategory ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData)
      });

      const data = await response.json();
      console.log('서버 응답:', data);

      if (!data.success) {
        throw new Error(data.error || '작업에 실패했습니다.');
      }

      message.success(selectedCategory ? '카테고리가 수정되었습니다.' : '카테고리가 생성되었습니다.');
      setIsModalOpen(false);
      setSelectedCategory(null);
      form.resetFields();
      fetchCategories();
    } catch (error) {
      console.error('작업 중 오류:', error);
      message.error(error instanceof Error ? error.message : '작업에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 카테고리 삭제
  const handleDelete = async (id: number) => {
    try {
      const response = await fetch(`/api/category?id=${id}`, {
        method: 'DELETE'
      });

      const data = await response.json();
      if (data.success) {
        message.success('카테고리가 삭제되었습니다.');
        if (selectedCategory?.id === id) {
          setSelectedCategory(null);
          form.resetFields();
        }
        fetchCategories();
      } else {
        message.error(data.error || '카테고리 삭제에 실패했습니다.');
      }
    } catch (error) {
      console.error('카테고리 삭제 중 오류:', error);
      message.error('카테고리 삭제에 실패했습니다.');
    }
  };

  const columns: ColumnsType<CategoryData> = [
    {
      title: '코드',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '이름',
      dataIndex: 'label',
      key: 'label',
    },
    {
      title: '설명',
      dataIndex: 'description',
      key: 'description',
    },
    {
      title: '작업',
      key: 'action',
      render: (_: unknown, record: CategoryData) => (
        <div className="space-x-2">
          <EditButton onClick={() => showModal(record)} />
          <DeleteButton onClick={() => handleDelete(record.id)} />
        </div>
      ),
    },
  ];

  return (
    <div className="p-6">
      <div className="mb-4">
        <AddButton onClick={() => showModal()} />
      </div>

      <Table<CategoryData>
        columns={columns}
        dataSource={categories}
        rowKey="id"
        className="w-full"
      />

      <Modal
        title={selectedCategory ? "카테고리 수정" : "새 카테고리 추가"}
        open={isModalOpen}
        onOk={handleSubmit}
        onCancel={handleCancel}
        confirmLoading={loading}
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
          preserve={false}
        >
          <Form.Item
            name="name"
            label="카테고리 이름"
            rules={[{ required: true, message: '카테고리 이름을 입력해주세요' }]}
          >
            <Input placeholder="카테고리 이름을 입력하세요" />
          </Form.Item>
          <Form.Item
            name="description"
            label="설명"
          >
            <Input.TextArea 
              placeholder="설명을 입력하세요"
              rows={4}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
} 