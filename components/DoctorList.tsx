
import React, { useMemo, useState, useEffect } from 'react';
import { SPECIALTY_OPTIONS } from '../constants';
import { Doctor } from '../types';
import { Filter, Stethoscope, ChevronRight, Search, Star, Clock, MapPin, Sparkles, ArrowRight } from 'lucide-react';

interface DoctorListProps {
  initialFilter?: string;
  onBook: (doctor: Doctor, aiSummary?: string) => void;
  doctors: Doctor[];
}

export const DoctorList: React.FC<DoctorListProps> = ({ initialFilter, onBook, doctors }) => {
  const [selectedSpecialty, setSelectedSpecialty] = useState<string>(initialFilter || 'All');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (initialFilter) setSelectedSpecialty(initialFilter);
  }, [initialFilter]);

  const filteredDoctors = useMemo(() => {
    return doctors.filter(doc => {
      const matchSpecialty = selectedSpecialty === 'All' || doc.specialty === selectedSpecialty;
      const matchSearch = doc.name.toLowerCase().includes(searchTerm.toLowerCase());
      return matchSpecialty && matchSearch;
    });
  }, [selectedSpecialty, searchTerm, doctors]);

  return (
    <div className="bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100 h-full flex flex-col overflow-hidden">
      {/* --- HEADER SECTION --- */}
      <div className="p-6 border-b border-slate-100 bg-white z-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="font-black text-2xl text-slate-800 flex items-center gap-3">
              <div className="p-2.5 bg-teal-600 rounded-2xl shadow-lg shadow-teal-200">
                  <Stethoscope size={24} className="text-white" />
              </div>
              Đội ngũ Bác sĩ
            </h2>
            <p className="text-slate-500 text-sm mt-1 font-medium ml-1">Chọn chuyên gia phù hợp với bạn</p>
          </div>
          
          {/* Search Input */}
          <div className="relative w-full md:w-64">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Tìm tên bác sĩ..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 pl-11 pr-4 py-3 rounded-2xl text-sm font-semibold outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white transition-all placeholder:font-normal"
            />
          </div>
        </div>
        
        {/* Specialty Filter Chips */}
        <div className="flex gap-2.5 overflow-x-auto pb-2 scrollbar-hide -mx-2 px-2">
          <button
            onClick={() => setSelectedSpecialty('All')}
            className={`whitespace-nowrap px-5 py-2.5 rounded-2xl text-sm font-bold transition-all duration-300 border
              ${selectedSpecialty === 'All' 
                ? 'bg-slate-900 text-white border-slate-900 shadow-lg shadow-slate-200 scale-105' 
                : 'bg-white border-slate-200 text-slate-500 hover:border-teal-500 hover:text-teal-600'}`}
          >
            Tất cả
          </button>
          {SPECIALTY_OPTIONS.map((spec) => (
            <button
              key={spec}
              onClick={() => setSelectedSpecialty(spec)}
              className={`whitespace-nowrap px-5 py-2.5 rounded-2xl text-sm font-bold transition-all duration-300 border
                ${selectedSpecialty === spec 
                  ? 'bg-teal-600 text-white border-teal-600 shadow-lg shadow-teal-100 scale-105' 
                  : 'bg-white border-slate-200 text-slate-500 hover:border-teal-500 hover:text-teal-600'}`}
            >
              {spec}
            </button>
          ))}
        </div>
      </div>

      {/* --- DOCTOR GRID --- */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-slate-50/50">
        {filteredDoctors.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-400 p-8 text-center animate-fade-in">
            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                <Search size={32} className="opacity-40" />
            </div>
            <p className="font-bold text-lg text-slate-600">Không tìm thấy bác sĩ</p>
            <p className="text-sm">Vui lòng thử từ khóa hoặc chuyên khoa khác.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pb-4">
            {filteredDoctors.map((doctor) => (
              <div 
                key={doctor.id} 
                className="group bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-2xl hover:shadow-slate-200 hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between"
              >
                <div className="flex items-start gap-4 mb-4">
                  <div className="relative shrink-0">
                      <img 
                        src={doctor.image || 'https://via.placeholder.com/150'} 
                        alt={doctor.name} 
                        className="w-20 h-20 rounded-[1.2rem] object-cover shadow-md border border-slate-100 group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute -bottom-2 -right-2 bg-white p-1 rounded-full shadow-sm">
                        <div className="bg-green-500 w-3 h-3 rounded-full border-2 border-white"></div>
                      </div>
                  </div>
                  
                  <div className="flex-1 min-w-0 pt-1">
                    <span className="inline-block px-2.5 py-1 rounded-lg bg-teal-50 text-teal-700 text-[10px] font-black uppercase tracking-wider mb-1.5 border border-teal-100">
                        {doctor.specialty}
                    </span>
                    <h3 className="font-black text-slate-800 text-lg leading-tight truncate group-hover:text-teal-600 transition-colors">
                      {doctor.name}
                    </h3>
                    <div className="flex items-center gap-3 mt-2 text-xs font-semibold text-slate-500">
                        <span className="flex items-center gap-1 bg-slate-50 px-2 py-1 rounded-lg border border-slate-100">
                            <Star size={12} className="text-yellow-400 fill-yellow-400"/> 
                            <span className="text-slate-700">4.9</span>
                        </span>
                        <span className="flex items-center gap-1">
                            <Clock size={12} className="text-slate-400"/> {doctor.experience} năm KN
                        </span>
                    </div>
                  </div>
                </div>
                
                <div className="mt-auto pt-4 border-t border-dashed border-slate-100 flex items-center gap-3">
                   <div className="flex-1">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Phí tư vấn</p>
                      <p className="text-slate-900 font-black text-lg">
                          {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(doctor.price)}
                      </p>
                   </div>
                  <button 
                    onClick={() => onBook(doctor)}
                    className="bg-slate-900 hover:bg-teal-600 text-white text-xs font-bold py-3.5 px-6 rounded-2xl transition-all shadow-lg shadow-slate-200 hover:shadow-teal-200 flex items-center gap-2 group/btn"
                  >
                    Đặt lịch
                    <ArrowRight size={14} className="group-hover/btn:translate-x-1 transition-transform" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
