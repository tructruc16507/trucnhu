/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Calculator, 
  RotateCcw, 
  FileDown, 
  Info, 
  CheckCircle2, 
  AlertCircle,
  School,
  Save,
  LayoutDashboard,
  ArrowLeft,
  Trash2,
  User,
} from 'lucide-react';
import { motion } from 'motion/react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

// --- Types ---
interface ScoreState {
  // Section I
  i1_violations: number;
  i2_academic: number;
  i3_hardship: number;
  i4_teacherEval: number;
  i5_gpa: string;
  i6_bonus: string[]; // ['khoa', 'truong', 'tinh']

  // Section II
  ii1_rules: number;
  ii2_regulations: number;
  ii3_insurance: number;

  // Section III
  iii1_absences: number;
  iii2_social: number;
  iii3_youthUnion: string;
  iii4_bonus: string[];

  // Section IV
  iv1_policy: number;
  iv2_law: number;
  iv3_social: number;
  iv4_solidarity: number;
  iv5_mutual: number;

  // Section V
  v_position: string;
}

const initialScores: ScoreState = {
  i1_violations: 0,
  i2_academic: 0,
  i3_hardship: 0,
  i4_teacherEval: 0,
  i5_gpa: '',
  i6_bonus: [],
  ii1_rules: 0,
  ii2_regulations: 0,
  ii3_insurance: 0,
  iii1_absences: 0,
  iii2_social: 0,
  iii3_youthUnion: '',
  iii4_bonus: [],
  iv1_policy: 0,
  iv2_law: 0,
  iv3_social: 0,
  iv4_solidarity: 0,
  iv5_mutual: 0,
  v_position: 'none',
};

export default function App() {
  const [studentScores, setStudentScores] = useState<ScoreState>({ ...initialScores });
  const [studentInfo, setStudentInfo] = useState({
    name: '',
    dob: '',
    mssv: '',
    class: 'ĐHKTDN25A',
    faculty: 'Kinh tế Luật',
    semester: '1',
    year: '2024 - 2025'
  });
  const [isAdminView, setIsAdminView] = useState(false);
  const [allEvaluations, setAllEvaluations] = useState<any[]>([]);
  const [selectedEvaluation, setSelectedEvaluation] = useState<any | null>(null);
  const [confirmConfig, setConfirmConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    confirmText: string;
    isDanger: boolean;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
    confirmText: 'Xác nhận',
    isDanger: false
  });
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');

  // --- Logic Calculations ---
  const calculateSectionTotals = (scores: ScoreState) => {
    // Section I: Max 20
    let s1 = (5 - scores.i1_violations) + 
             scores.i2_academic + 
             scores.i3_hardship + 
             scores.i4_teacherEval;
    
    const gpaMap: Record<string, number> = { '1': 3, '2': 4, '3': 5, '4': 6 };
    s1 += gpaMap[scores.i5_gpa] || 0;
    
    if (scores.i6_bonus.includes('khoa')) s1 += 1;
    if (scores.i6_bonus.includes('truong')) s1 += 2;
    if (scores.i6_bonus.includes('tinh')) s1 += 3;
    const totalI = Math.min(20, Math.max(0, s1));

    // Section II: Max 25
    const totalII = Math.min(25, Math.max(0, scores.ii1_rules + scores.ii2_regulations + scores.ii3_insurance));

    // Section III: Max 20
    let s3 = (10 - scores.iii1_absences * 5) + scores.iii2_social;
    const youthMap: Record<string, number> = { 'kha': 3, 'xs': 5 };
    s3 += youthMap[scores.iii3_youthUnion] || 0;
    
    if (scores.iii4_bonus.includes('khoa')) s3 += 1;
    if (scores.iii4_bonus.includes('truong')) s3 += 2;
    if (scores.iii4_bonus.includes('tinh')) s3 += 3;
    const totalIII = Math.min(20, Math.max(0, s3));

    // Section IV: Max 25
    const totalIV = Math.min(25, Math.max(0, scores.iv1_policy + scores.iv2_law + scores.iv3_social + scores.iv4_solidarity + scores.iv5_mutual));

    // Section V: Max 10
    let totalV = 0;
    const pos = scores.v_position;
    if (pos === 'none') totalV = 4;
    else if (pos === 'fail') totalV = 0;
    else if (pos === 'truong_xs') totalV = 10;
    else if (pos === 'truong_tot') totalV = 9;
    else if (pos === 'truong_kha') totalV = 8;
    else if (pos === 'truong_tbk') totalV = 6;
    else if (pos === 'pho_xs') totalV = 8;
    else if (pos === 'pho_tot') totalV = 7;
    else if (pos === 'pho_kha') totalV = 6;
    else if (pos === 'pho_tbk') totalV = 4;

    return {
      I: totalI,
      II: totalII,
      III: totalIII,
      IV: totalIV,
      V: totalV,
      total: totalI + totalII + totalIII + totalIV + totalV
    };
  };

  const studentTotals = useMemo(() => calculateSectionTotals(studentScores), [studentScores]);

  const finalScore = useMemo(() => {
    return studentTotals.total;
  }, [studentTotals]);

  // --- Handlers ---
  const updateScore = (field: keyof ScoreState, value: any) => {
    setStudentScores(prev => ({ ...prev, [field]: value }));
  };

  const resetData = () => {
    setConfirmConfig({
      isOpen: true,
      title: 'Xóa dữ liệu nhập',
      message: 'Bạn có chắc chắn muốn xóa toàn bộ dữ liệu đã nhập trên form? Thao tác này sẽ làm trống các trường thông tin.',
      confirmText: 'Xác nhận xóa',
      isDanger: true,
      onConfirm: () => {
        setStudentScores({ ...initialScores });
        setStudentInfo({
          name: '',
          dob: '',
          mssv: '',
          class: 'ĐHKTDN25A',
          faculty: 'Kinh tế Luật',
          semester: '1',
          year: '2024 - 2025'
        });
        setConfirmConfig(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const saveEvaluation = async () => {
    if (!studentInfo.name || !studentInfo.mssv) {
      alert('Vui lòng nhập Họ tên và MSSV trước khi lưu!');
      return;
    }

    setIsSaving(true);
    setSaveStatus('idle');
    try {
      const response = await fetch('/api/evaluations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          info: studentInfo,
          scores: studentScores,
          totals: studentTotals,
          finalScore: finalScore
        })
      });

      if (response.ok) {
        setSaveStatus('success');
        setTimeout(() => setSaveStatus('idle'), 3000);
      } else {
        setSaveStatus('error');
      }
    } catch (error) {
      console.error('Save error:', error);
      setSaveStatus('error');
    } finally {
      setIsSaving(false);
    }
  };

  const fetchAllEvaluations = async () => {
    try {
      const response = await fetch('/api/evaluations');
      if (response.ok) {
        const data = await response.json();
        setAllEvaluations(data);
      }
    } catch (error) {
      console.error('Fetch error:', error);
    }
  };

  const resetAllEvaluations = async () => {
    setConfirmConfig({
      isOpen: true,
      title: 'Xóa tất cả dữ liệu',
      message: 'CẢNH BÁO: Bạn có chắc chắn muốn xóa TOÀN BỘ danh sách bài đánh giá trên máy chủ? Hành động này không thể hoàn tác.',
      confirmText: 'Xóa tất cả',
      isDanger: true,
      onConfirm: async () => {
        try {
          const response = await fetch('/api/evaluations', { method: 'DELETE' });
          if (response.ok) {
            setAllEvaluations([]);
            setConfirmConfig(prev => ({ ...prev, isOpen: false }));
          }
        } catch (error) {
          console.error('Reset error:', error);
          alert('Lỗi khi xóa danh sách.');
        }
      }
    });
  };

  const deleteEvaluation = async (id: string) => {
    setConfirmConfig({
      isOpen: true,
      title: 'Xác nhận xóa',
      message: 'Bạn có chắc chắn muốn xóa bài đánh giá này không? Thao tác này không thể hoàn tác.',
      confirmText: 'Xác nhận xóa',
      isDanger: true,
      onConfirm: async () => {
        try {
          const response = await fetch(`/api/evaluations/${id}`, { method: 'DELETE' });
          if (response.ok) {
            setAllEvaluations(prev => prev.filter(e => e.id !== id));
            if (selectedEvaluation?.id === id) {
              setSelectedEvaluation(null);
            }
            setConfirmConfig(prev => ({ ...prev, isOpen: false }));
          }
        } catch (error) {
          console.error('Delete error:', error);
          alert('Lỗi khi xóa bài đánh giá.');
        }
      }
    });
    return false;
  };

  useEffect(() => {
    if (isAdminView) {
      fetchAllEvaluations();
    }
  }, [isAdminView]);

  const exportPDF = async () => {
    if (isAdminView) {
      // Export all evaluations to server
      const element = document.getElementById('admin-table');
      if (!element) return;
      
      const canvas = await html2canvas(element, { scale: 2 });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      const pdfBase64 = pdf.output('datauristring');
      
      try {
        const response = await fetch('/api/save-pdf', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            pdfData: pdfBase64,
            fileName: `All_Evaluations_${Date.now()}.pdf`
          })
        });
        if (response.ok) {
          alert('Tất cả bài đánh giá đã được lưu vào file PDF trên máy chủ.');
        }
      } catch (error) {
        console.error('Export error:', error);
        alert('Lỗi khi lưu PDF lên máy chủ.');
      }
      return;
    }

    const element = document.getElementById('report-table');
    if (!element) return;
    
    const canvas = await html2canvas(element, { scale: 2 });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const imgProps = pdf.getImageProperties(imgData);
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
    
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    pdf.save('Phieu_Danh_Gia_DRL.pdf');
  };

  // --- Components ---
  const InputNumber = ({ label, value, max, onChange, tooltip }: { label: string, value: number, max: number, onChange: (val: number) => void, tooltip?: string }) => {
    const isError = value > max || value < 0;
    return (
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-1">
          <span className="text-xs font-medium text-slate-600">{label}</span>
          {tooltip && (
            <div className="group relative">
              <Info size={12} className="text-slate-400 cursor-help" />
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block w-48 p-2 bg-slate-800 text-white text-[10px] rounded shadow-lg z-50">
                {tooltip}
              </div>
            </div>
          )}
        </div>
        <input 
          type="number" 
          value={value}
          onChange={(e) => onChange(Math.max(0, parseFloat(e.target.value) || 0))}
          className={`w-full p-2 border rounded text-sm transition-colors ${isError ? 'border-red-500 bg-red-50 text-red-600' : 'border-slate-200 focus:border-blue-500 outline-none'}`}
        />
        <span className="text-[10px] text-slate-400">Tối đa: {max}</span>
      </div>
    );
  };

  const SectionHeader = ({ title, max, score }: { title: string, max: number, score: number }) => (
    <div className="bg-emerald-50 border-y border-emerald-100 p-3 flex justify-between items-center sticky top-0 z-10">
      <h3 className="font-bold text-emerald-800 uppercase text-sm tracking-wide">{title}</h3>
      <div className="flex items-center gap-4">
        <span className="text-xs text-emerald-600 font-medium">Tối đa: {max}</span>
        <div className="bg-emerald-600 text-white px-3 py-1 rounded-full text-xs font-bold shadow-sm">
          Đạt: {score}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-20">
      {/* Header */}
      <header className="bg-blue-700 text-white p-6 shadow-md sticky top-0 z-30">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded-lg">
              <Calculator size={32} />
            </div>
            <div>
              <h1 className="text-xl font-black uppercase tracking-tighter">Đánh giá điểm rèn luyện</h1>
              <p className="text-blue-100 text-xs font-medium">Hệ thống tính điểm chuẩn Đại học Việt Nam</p>
            </div>
          </div>
          
          <div className="flex gap-2 items-center">
            <button 
              onClick={() => setIsAdminView(!isAdminView)}
              className="flex items-center gap-2 bg-white/10 hover:bg-white/20 px-4 py-2 rounded-full text-sm font-bold transition-all border border-white/20"
            >
              {isAdminView ? <ArrowLeft size={16} /> : <LayoutDashboard size={16} />}
              {isAdminView ? 'Quay lại' : 'Quản lý'}
            </button>
            <button 
              onClick={resetData}
              className="flex items-center gap-2 bg-white/10 hover:bg-white/20 px-4 py-2 rounded-full text-sm font-bold transition-all border border-white/20"
            >
              <RotateCcw size={16} /> Reset
            </button>
            <button 
              onClick={saveEvaluation}
              disabled={isSaving}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold transition-all shadow-lg ${
                saveStatus === 'success' ? 'bg-emerald-500' : 
                saveStatus === 'error' ? 'bg-red-500' :
                'bg-blue-500 hover:bg-blue-600'
              } disabled:opacity-50`}
            >
              <Save size={16} className={isSaving ? 'animate-spin' : ''} />
              {isSaving ? 'Đang lưu...' : saveStatus === 'success' ? 'Đã lưu!' : 'Lưu kết quả'}
            </button>
            <button 
              onClick={exportPDF}
              className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 px-4 py-2 rounded-full text-sm font-bold transition-all shadow-lg"
            >
              <FileDown size={16} /> {isAdminView ? 'Lưu PDF lên máy chủ' : 'Xuất PDF'}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto mt-6 px-4">
        {isAdminView ? (
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h2 className="text-xl font-black uppercase tracking-tight text-slate-800">Danh sách bài đánh giá (Máy chủ)</h2>
              <div className="flex gap-2">
                <button 
                  onClick={resetAllEvaluations}
                  className="flex items-center gap-2 bg-red-50 text-red-600 hover:bg-red-100 px-4 py-2 rounded-full text-xs font-bold transition-all border border-red-200"
                >
                  <Trash2 size={16} /> Xóa tất cả
                </button>
                <button onClick={fetchAllEvaluations} className="p-2 hover:bg-slate-100 rounded-full transition-colors border border-slate-200">
                  <RotateCcw size={18} className="text-slate-400" />
                </button>
              </div>
            </div>
            <div className="overflow-x-auto" id="admin-table">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-200">
                    <th className="p-4 text-xs font-bold text-slate-500 uppercase">Họ và tên</th>
                    <th className="p-4 text-xs font-bold text-slate-500 uppercase">MSSV</th>
                    <th className="p-4 text-xs font-bold text-slate-500 uppercase">Lớp</th>
                    <th className="p-4 text-xs font-bold text-slate-500 uppercase text-center">Điểm</th>
                    <th className="p-4 text-xs font-bold text-slate-500 uppercase text-center">Xếp loại</th>
                    <th className="p-4 text-xs font-bold text-slate-500 uppercase">Ngày lưu</th>
                    <th className="p-4 text-xs font-bold text-slate-500 uppercase text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {allEvaluations.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-10 text-center text-slate-400 italic">Chưa có bài đánh giá nào được lưu.</td>
                    </tr>
                  ) : (
                    allEvaluations.map((evalItem) => (
                      <tr key={evalItem.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                        <td className="p-4 text-sm font-bold text-slate-700">{evalItem.info.name}</td>
                        <td className="p-4 text-sm text-slate-600">{evalItem.info.mssv}</td>
                        <td className="p-4 text-sm text-slate-600">{evalItem.info.class}</td>
                        <td className="p-4 text-sm font-black text-center text-blue-600">{evalItem.finalScore.toFixed(1)}</td>
                        <td className="p-4 text-center">
                          <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${
                            evalItem.finalScore >= 90 ? 'bg-emerald-100 text-emerald-700' :
                            evalItem.finalScore >= 80 ? 'bg-blue-100 text-blue-700' :
                            evalItem.finalScore >= 65 ? 'bg-indigo-100 text-indigo-700' :
                            'bg-red-100 text-red-700'
                          }`}>
                            {
                              evalItem.finalScore >= 90 ? 'Xuất sắc' :
                              evalItem.finalScore >= 80 ? 'Tốt' :
                              evalItem.finalScore >= 65 ? 'Khá' :
                              evalItem.finalScore >= 50 ? 'Trung bình' : 'Yếu'
                            }
                          </span>
                        </td>
                        <td className="p-4 text-xs text-slate-400">
                          {new Date(evalItem.createdAt).toLocaleString('vi-VN')}
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex justify-end gap-3">
                            <button 
                              onClick={() => setSelectedEvaluation(evalItem)}
                              className="text-blue-600 hover:text-blue-800 text-xs font-bold underline"
                            >
                              Xem chi tiết
                            </button>
                            <button 
                              onClick={() => deleteEvaluation(evalItem.id)}
                              className="text-red-500 hover:text-red-700 transition-colors"
                              title="Xóa bài này"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
        <div id="report-table">
          {/* Student Information Section */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-1">
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Họ và tên</label>
                <input 
                  type="text" 
                  value={studentInfo.name}
                  onChange={(e) => setStudentInfo({...studentInfo, name: e.target.value})}
                  placeholder="__________________" 
                  className="w-full border-b border-slate-300 focus:border-blue-500 outline-none py-1 text-sm font-medium" 
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Ngày tháng năm sinh</label>
                <input 
                  type="text" 
                  value={studentInfo.dob}
                  onChange={(e) => setStudentInfo({...studentInfo, dob: e.target.value})}
                  placeholder="___/___/___" 
                  className="w-full border-b border-slate-300 focus:border-blue-500 outline-none py-1 text-sm font-medium" 
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">MSSV</label>
                <input 
                  type="text" 
                  value={studentInfo.mssv}
                  onChange={(e) => setStudentInfo({...studentInfo, mssv: e.target.value})}
                  placeholder="_____________" 
                  className="w-full border-b border-slate-300 focus:border-blue-500 outline-none py-1 text-sm font-medium" 
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Lớp</label>
                <input 
                  type="text" 
                  value={studentInfo.class}
                  onChange={(e) => setStudentInfo({...studentInfo, class: e.target.value})}
                  className="w-full border-b border-slate-300 focus:border-blue-500 outline-none py-1 text-sm font-medium" 
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Khoa</label>
                <input 
                  type="text" 
                  value={studentInfo.faculty}
                  onChange={(e) => setStudentInfo({...studentInfo, faculty: e.target.value})}
                  className="w-full border-b border-slate-300 focus:border-blue-500 outline-none py-1 text-sm font-medium" 
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Học kì</label>
                <input 
                  type="text" 
                  value={studentInfo.semester}
                  onChange={(e) => setStudentInfo({...studentInfo, semester: e.target.value})}
                  className="w-full border-b border-slate-300 focus:border-blue-500 outline-none py-1 text-sm font-medium" 
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Năm học</label>
                <input 
                  type="text" 
                  value={studentInfo.year}
                  onChange={(e) => setStudentInfo({...studentInfo, year: e.target.value})}
                  className="w-full border-b border-slate-300 focus:border-blue-500 outline-none py-1 text-sm font-medium" 
                />
              </div>
            </div>
          </div>

          {/* Form Content */}
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
          
          {/* Section I */}
          <SectionHeader 
            title="I. Đánh giá về ý thức học tập" 
            max={20} 
            score={studentTotals.I} 
          />
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <InputNumber 
              label="1. Vi phạm đi học muộn/vắng" 
              max={5} 
              value={studentScores.i1_violations}
              onChange={(v) => updateScore('i1_violations', v)}
              tooltip="Mặc định 5đ. Trừ 1đ mỗi lần vi phạm."
            />
            
            <InputNumber 
              label="2. Hoạt động học thuật" 
              max={5} 
              value={studentScores.i2_academic}
              onChange={(v) => updateScore('i2_academic', v)}
              tooltip="Cộng từ 1 đến 5 điểm tùy theo mức độ tham gia."
            />

            <InputNumber 
              label="3. Tinh thần vượt khó" 
              max={2} 
              value={studentScores.i3_hardship}
              onChange={(v) => updateScore('i3_hardship', v)}
            />

            <InputNumber 
              label="4. Đánh giá giảng viên" 
              max={2} 
              value={studentScores.i4_teacherEval}
              onChange={(v) => updateScore('i4_teacherEval', v)}
            />

            <div className="flex flex-col gap-1">
              <span className="text-xs font-medium text-slate-600">5. Kết quả học tập (TBCHT)</span>
              <select 
                value={studentScores.i5_gpa}
                onChange={(e) => updateScore('i5_gpa', e.target.value)}
                className="w-full p-2 border border-slate-200 rounded text-sm focus:border-blue-500 outline-none"
              >
                <option value="">-- Chọn mức điểm --</option>
                <option value="1">2.00 - 2.49 (3đ)</option>
                <option value="2">2.50 - 3.19 (4đ)</option>
                <option value="3">3.20 - 3.59 (5đ)</option>
                <option value="4">3.60 - 4.00 (6đ)</option>
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <span className="text-xs font-medium text-slate-600">6. Điểm thưởng học thuật</span>
              <div className="flex flex-wrap gap-2">
                {[
                  { id: 'khoa', label: 'Khoa (+1)', val: 1 },
                  { id: 'truong', label: 'Trường (+2)', val: 2 },
                  { id: 'tinh', label: 'Tỉnh (+3)', val: 3 },
                ].map(item => (
                  <button
                    key={item.id}
                    onClick={() => {
                      const current = studentScores.i6_bonus;
                      const next = current.includes(item.id) ? current.filter(i => i !== item.id) : [...current, item.id];
                      updateScore('i6_bonus', next);
                    }}
                    className={`px-2 py-1 rounded text-[10px] font-bold border transition-all ${
                      studentScores.i6_bonus.includes(item.id)
                      ? 'bg-emerald-600 text-white border-emerald-600'
                      : 'bg-slate-50 text-slate-500 border-slate-200'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Section II */}
          <SectionHeader 
            title="II. Ý thức chấp hành nội quy, quy chế" 
            max={25} 
            score={studentTotals.II} 
          />
          <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
            <InputNumber 
              label="1. Chấp hành nội quy" 
              max={5} 
              value={studentScores.ii1_rules}
              onChange={(v) => updateScore('ii1_rules', v)}
            />
            <InputNumber 
              label="2. Quy chế thi/học vụ" 
              max={10} 
              value={studentScores.ii2_regulations}
              onChange={(v) => updateScore('ii2_regulations', v)}
            />
            <InputNumber 
              label="3. Bảo hiểm y tế/Xã hội" 
              max={10} 
              value={studentScores.ii3_insurance}
              onChange={(v) => updateScore('ii3_insurance', v)}
            />
          </div>

          {/* Section III */}
          <SectionHeader 
            title="III. Ý thức tham gia hoạt động CT-XH, Đoàn, Hội" 
            max={20} 
            score={studentTotals.III} 
          />
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <InputNumber 
              label="1. Vắng hoạt động (lần)" 
              max={2} 
              value={studentScores.iii1_absences}
              onChange={(v) => updateScore('iii1_absences', v)}
              tooltip="Mặc định 10đ. Trừ 5đ mỗi lần vắng không lý do."
            />
            <InputNumber 
              label="2. Hoạt động xã hội khác" 
              max={5} 
              value={studentScores.iii2_social}
              onChange={(v) => updateScore('iii2_social', v)}
            />
            <div className="flex flex-col gap-1">
              <span className="text-xs font-medium text-slate-600">3. Xếp loại Đoàn viên</span>
              <select 
                value={studentScores.iii3_youthUnion}
                onChange={(e) => updateScore('iii3_youthUnion', e.target.value)}
                className="w-full p-2 border border-slate-200 rounded text-sm focus:border-blue-500 outline-none"
              >
                <option value="">-- Chọn xếp loại --</option>
                <option value="kha">Khá (3đ)</option>
                <option value="xs">Xuất sắc (5đ)</option>
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xs font-medium text-slate-600">4. Thưởng hoạt động</span>
              <div className="flex flex-wrap gap-2">
                {[
                  { id: 'khoa', label: 'Khoa (+1)' },
                  { id: 'truong', label: 'Trường (+2)' },
                  { id: 'tinh', label: 'Tỉnh (+3)' },
                ].map(item => (
                  <button
                    key={item.id}
                    onClick={() => {
                      const current = studentScores.iii4_bonus;
                      const next = current.includes(item.id) ? current.filter(i => i !== item.id) : [...current, item.id];
                      updateScore('iii4_bonus', next);
                    }}
                    className={`px-2 py-1 rounded text-[10px] font-bold border transition-all ${
                      studentScores.iii4_bonus.includes(item.id)
                      ? 'bg-emerald-600 text-white border-emerald-600'
                      : 'bg-slate-50 text-slate-500 border-slate-200'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Section IV */}
          <SectionHeader 
            title="IV. Ý thức công dân và quan hệ cộng đồng" 
            max={25} 
            score={studentTotals.IV} 
          />
          <div className="p-6 grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
            <InputNumber label="1. Chính sách" max={5} value={studentScores.iv1_policy} onChange={(v) => updateScore('iv1_policy', v)} />
            <InputNumber label="2. Pháp luật" max={5} value={studentScores.iv2_law} onChange={(v) => updateScore('iv2_law', v)} />
            <InputNumber label="3. HĐ xã hội" max={5} value={studentScores.iv3_social} onChange={(v) => updateScore('iv3_social', v)} />
            <InputNumber label="4. Đoàn kết" max={5} value={studentScores.iv4_solidarity} onChange={(v) => updateScore('iv4_solidarity', v)} />
            <InputNumber label="5. Tương thân" max={5} value={studentScores.iv5_mutual} onChange={(v) => updateScore('iv5_mutual', v)} />
          </div>

          {/* Section V */}
          <SectionHeader 
            title="V. Ý thức tham gia công tác lớp, đoàn thể" 
            max={10} 
            score={studentTotals.V} 
          />
          <div className="p-6">
            <div className="flex flex-col gap-2 max-w-md">
              <span className="text-xs font-medium text-slate-600">Chức vụ và mức độ hoàn thành</span>
              <select 
                value={studentScores.v_position}
                onChange={(e) => updateScore('v_position', e.target.value)}
                className="w-full p-2 border border-slate-200 rounded text-sm focus:border-blue-500 outline-none"
              >
                <option value="none">Không là cán bộ (4đ)</option>
                <option value="fail">Không hoàn thành nhiệm vụ (0đ)</option>
                <optgroup label="Cấp trưởng (Lớp trưởng, Bí thư...)">
                  <option value="truong_xs">Xuất sắc (10đ)</option>
                  <option value="truong_tot">Tốt (9đ)</option>
                  <option value="truong_kha">Khá (8đ)</option>
                  <option value="truong_tbk">Trung bình khá (6đ)</option>
                </optgroup>
                <optgroup label="Cấp phó (Lớp phó, Phó bí thư...)">
                  <option value="pho_xs">Xuất sắc (8đ)</option>
                  <option value="pho_tot">Tốt (7đ)</option>
                  <option value="pho_kha">Khá (6đ)</option>
                  <option value="pho_tbk">Trung bình khá (4đ)</option>
                </optgroup>
              </select>
            </div>
          </div>
        </div>

        {/* Summary Card */}
        <div className="grid grid-cols-1 gap-6 mt-10">
          <div className="bg-white p-6 rounded-2xl shadow-lg border-b-4 border-blue-500">
            <div className="flex justify-between items-start mb-4">
              <h4 className="text-slate-500 font-bold text-xs uppercase">Tổng điểm rèn luyện</h4>
              <User className="text-blue-500" size={20} />
            </div>
            <div className="text-3xl font-black text-slate-800">{studentTotals.total} <span className="text-sm font-normal text-slate-400">/ 100</span></div>
          </div>
        </div>

        {/* Final Result */}
        <div className="mt-10 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl p-8 text-white shadow-2xl flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex items-center gap-6">
            <div className="bg-white/20 p-4 rounded-2xl backdrop-blur-md">
              <CheckCircle2 size={48} />
            </div>
            <div>
              <h2 className="text-2xl font-black uppercase tracking-tight">Kết quả xếp loại</h2>
              <p className="text-blue-100 opacity-80">Dựa trên điểm tự đánh giá của sinh viên</p>
            </div>
          </div>
          
          <div className="flex flex-col items-center md:items-end">
            <div className="text-7xl font-black tracking-tighter tabular-nums">
              {finalScore.toFixed(1)}
            </div>
            <div className="bg-white/20 px-4 py-1 rounded-full text-xs font-bold mt-2 uppercase tracking-widest">
              Xếp loại: {
                finalScore >= 90 ? 'Xuất sắc' :
                finalScore >= 80 ? 'Tốt' :
                finalScore >= 65 ? 'Khá' :
                finalScore >= 50 ? 'Trung bình' :
                finalScore >= 35 ? 'Yếu' : 'Kém'
              }
            </div>
          </div>
        </div>
        </div>
        )}
      </main>

      {/* Confirmation Modal */}
      {confirmConfig.isOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl p-8 text-center"
          >
            <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 ${confirmConfig.isDanger ? 'bg-red-50' : 'bg-blue-50'}`}>
              <AlertCircle size={40} className={confirmConfig.isDanger ? 'text-red-500' : 'text-blue-500'} />
            </div>
            <h3 className="text-xl font-black text-slate-800 mb-2 uppercase tracking-tight">{confirmConfig.title}</h3>
            <p className="text-slate-500 text-sm mb-8">
              {confirmConfig.message}
            </p>
            <div className="flex gap-4">
              <button 
                onClick={() => setConfirmConfig(prev => ({ ...prev, isOpen: false }))}
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold py-3 rounded-2xl transition-all"
              >
                Hủy bỏ
              </button>
              <button 
                onClick={confirmConfig.onConfirm}
                className={`flex-1 text-white font-bold py-3 rounded-2xl transition-all shadow-lg ${
                  confirmConfig.isDanger 
                  ? 'bg-red-600 hover:bg-red-700 shadow-red-200' 
                  : 'bg-blue-600 hover:bg-blue-700 shadow-blue-200'
                }`}
              >
                {confirmConfig.confirmText}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Detail Modal */}
      {selectedEvaluation && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col"
          >
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-blue-700 text-white">
              <div>
                <h2 className="text-xl font-black uppercase tracking-tight">Chi tiết bài đánh giá</h2>
                <p className="text-blue-100 text-xs">Sinh viên: {selectedEvaluation.info.name} - MSSV: {selectedEvaluation.info.mssv}</p>
              </div>
              <button 
                onClick={() => setSelectedEvaluation(null)}
                className="p-2 hover:bg-white/20 rounded-full transition-colors"
              >
                <ArrowLeft size={24} />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-8">
              {/* Info Summary */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div>
                  <span className="block text-[10px] font-bold text-slate-400 uppercase">Lớp</span>
                  <span className="text-sm font-bold text-slate-700">{selectedEvaluation.info.class}</span>
                </div>
                <div>
                  <span className="block text-[10px] font-bold text-slate-400 uppercase">Khoa</span>
                  <span className="text-sm font-bold text-slate-700">{selectedEvaluation.info.faculty}</span>
                </div>
                <div>
                  <span className="block text-[10px] font-bold text-slate-400 uppercase">Học kì / Năm học</span>
                  <span className="text-sm font-bold text-slate-700">{selectedEvaluation.info.semester} / {selectedEvaluation.info.year}</span>
                </div>
                <div>
                  <span className="block text-[10px] font-bold text-slate-400 uppercase">Tổng điểm</span>
                  <span className="text-sm font-black text-blue-600">{selectedEvaluation.finalScore.toFixed(1)}</span>
                </div>
              </div>

              {/* Scores Detail */}
              <div className="space-y-4">
                <div className="border border-slate-100 rounded-xl overflow-hidden">
                  <div className="bg-slate-50 p-3 font-bold text-xs uppercase text-slate-600">I. Ý thức học tập (Đạt: {selectedEvaluation.totals.I}/20)</div>
                  <div className="p-4 grid grid-cols-2 md:grid-cols-3 gap-4 text-xs">
                    <div>Vi phạm vắng: {selectedEvaluation.scores.i1_violations}</div>
                    <div>Học thuật: {selectedEvaluation.scores.i2_academic}</div>
                    <div>Vượt khó: {selectedEvaluation.scores.i3_hardship}</div>
                    <div>ĐG giảng viên: {selectedEvaluation.scores.i4_teacherEval}</div>
                    <div>GPA: {selectedEvaluation.scores.i5_gpa}</div>
                    <div>Thưởng: {selectedEvaluation.scores.i6_bonus.join(', ') || 'Không'}</div>
                  </div>
                </div>

                <div className="border border-slate-100 rounded-xl overflow-hidden">
                  <div className="bg-slate-50 p-3 font-bold text-xs uppercase text-slate-600">II. Nội quy, quy chế (Đạt: {selectedEvaluation.totals.II}/25)</div>
                  <div className="p-4 grid grid-cols-2 md:grid-cols-3 gap-4 text-xs">
                    <div>Nội quy: {selectedEvaluation.scores.ii1_rules}</div>
                    <div>Quy chế thi: {selectedEvaluation.scores.ii2_regulations}</div>
                    <div>BHYT/XH: {selectedEvaluation.scores.ii3_insurance}</div>
                  </div>
                </div>

                <div className="border border-slate-100 rounded-xl overflow-hidden">
                  <div className="bg-slate-50 p-3 font-bold text-xs uppercase text-slate-600">III. Hoạt động CT-XH (Đạt: {selectedEvaluation.totals.III}/20)</div>
                  <div className="p-4 grid grid-cols-2 md:grid-cols-3 gap-4 text-xs">
                    <div>Vắng HĐ: {selectedEvaluation.scores.iii1_absences}</div>
                    <div>HĐ xã hội: {selectedEvaluation.scores.iii2_social}</div>
                    <div>Đoàn viên: {selectedEvaluation.scores.iii3_youthUnion}</div>
                    <div>Thưởng: {selectedEvaluation.scores.iii4_bonus.join(', ') || 'Không'}</div>
                  </div>
                </div>

                <div className="border border-slate-100 rounded-xl overflow-hidden">
                  <div className="bg-slate-50 p-3 font-bold text-xs uppercase text-slate-600">IV. Ý thức công dân (Đạt: {selectedEvaluation.totals.IV}/25)</div>
                  <div className="p-4 grid grid-cols-2 md:grid-cols-3 gap-4 text-xs">
                    <div>Chính sách: {selectedEvaluation.scores.iv1_policy}</div>
                    <div>Pháp luật: {selectedEvaluation.scores.iv2_law}</div>
                    <div>HĐ xã hội: {selectedEvaluation.scores.iv3_social}</div>
                    <div>Đoàn kết: {selectedEvaluation.scores.iv4_solidarity}</div>
                    <div>Tương thân: {selectedEvaluation.scores.iv5_mutual}</div>
                  </div>
                </div>

                <div className="border border-slate-100 rounded-xl overflow-hidden">
                  <div className="bg-slate-50 p-3 font-bold text-xs uppercase text-slate-600">V. Công tác lớp, đoàn thể (Đạt: {selectedEvaluation.totals.V}/10)</div>
                  <div className="p-4 text-xs">
                    <div>Chức vụ: {selectedEvaluation.scores.v_position}</div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-between items-center">
              <button 
                onClick={async () => {
                  const success = await deleteEvaluation(selectedEvaluation.id);
                  if (success) {
                    setSelectedEvaluation(null);
                  }
                }}
                className="flex items-center gap-2 text-red-600 hover:text-red-700 font-bold text-sm transition-all"
              >
                <Trash2 size={18} /> Xóa bài đánh giá này
              </button>
              <button 
                onClick={() => setSelectedEvaluation(null)}
                className="bg-slate-800 text-white px-8 py-2 rounded-full font-bold text-sm shadow-lg hover:bg-slate-700 transition-all"
              >
                Đóng
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Footer Info */}
      <footer className="max-w-5xl mx-auto mt-12 px-4 text-center text-slate-400 text-xs pb-10">
        <p>© 2026 Hệ thống Quản lý Điểm Rèn Luyện Sinh viên. Tất cả các logic được tính toán theo quy định hiện hành.</p>
        <div className="flex justify-center gap-4 mt-2">
          <span className="flex items-center gap-1"><AlertCircle size={12} /> Dữ liệu chỉ mang tính chất tham khảo</span>
        </div>
      </footer>
    </div>
  );
}
