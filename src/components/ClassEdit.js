// src/components/ClassEdit.js (for editing)
import React from 'react';
import { useParams } from 'react-router-dom';
import AdminPanel from './AdminPanel';

const ClassEdit = () => {
  const { classId } = useParams();

  return <AdminPanel classId={classId} />;
};

export default ClassEdit;
