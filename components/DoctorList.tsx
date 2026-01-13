
import React, { useMemo, useState, useEffect } from 'react';
import { SPECIALTY_OPTIONS } from '../constants';
import { Doctor } from '../types';
import { Star, Clock, Filter, Stethoscope, ChevronRight } from 'lucide-react';

interface DoctorListProps {
  initialFilter?: string;
  onBook: (doctor: Doctor) => void;
  doctors: Doctor[];
}

export const DoctorList: React.FC<DoctorListProps> = ({ initialFilter, onBook, doctors }) => {
  const [selectedSpecialty, setSelectedSpecialty] = useState<string>(initialFilter || 'All');

  // Sync state if initialFilter changes from parent
  useEffect(() => {
    if (initialFilter) setSelectedSpecialty(initialFilter);
  }, [initialFilter]);

  const filteredDoctors = useMemo(() => {
    if (selectedSpecialty === 'All') return doctors;
    return doctors.filter(doc => doc.specialty === selectedSpecialty);
  }, [selectedSpecialty, doctors]);

  return (
    <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="p-5 border-b border-slate-100">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-bold text-xl text-slate-800 flex items-center gap-2.5">
            <div className="p-2 bg-teal-50 rounded-xl">
                <Stethoscope size={22} className="text-teal-600" />
            </div>
            Danh Sách Bác Sĩ
          </h2>
          <span className="text-xs font-bold bg-slate-900 text-white px-3 py-1 rounded-full">
            {filteredDoctors.length}
          </span>
        </div>
        
        {/* Chips Filter */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide -mx-1 px-1">
          <button
            onClick={() => setSelectedSpecialty('All')}
            className={`whitespace-nowrap px-4 py-2 rounded-xl text-xs font-semibold transition-all duration-200
              ${selectedSpecialty === 'All' 
                ? 'bg-slate-800 text-white shadow-md shadow-slate-200' 
                : 'bg-white border border-slate-200 text-slate-500 hover:border-slate-300 hover:bg-slate-50'}`}
          >
            Tất cả
          </button>
          {SPECIALTY_OPTIONS.map((spec) => (
            <button
              key={spec}
              onClick={() => setSelectedSpecialty(spec)}
              className={`whitespace-nowrap px-4 py-2 rounded-xl text-xs font-semibold transition-all duration-200
                ${selectedSpecialty === spec 
                  ? 'bg-teal-600 text-white shadow-md shadow-teal-100' 
                  : 'bg-white border border-slate-200 text-slate-500 hover:border-slate-300 hover:bg-slate-50'}`}
            >
              {spec}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
        {filteredDoctors.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-400 p-8 text-center">
            <Filter size={48} className="mb-3 opacity-20" />
            <p>Không tìm thấy bác sĩ cho chuyên khoa này.</p>
          </div>
        ) : (
          filteredDoctors.map((doctor) => (
            <div key={doctor.id} className="group bg-white p-4 rounded-2xl border border-slate-100 shadow-sm hover:shadow-lg hover:border-teal-100 transition-all duration-300">
              <div className="flex gap-4">
                <div className="relative shrink-0">
                    <img 
                    src={doctor.image} 
                    alt={doctor.name} 
                    className="w-16 h-16 rounded-2xl object-cover"
                    />
                    <div className="absolute -bottom-1.5 -right-1.5 bg-white p-0.5 rounded-lg shadow-sm">
                        <div className="flex items-center gap-0.5 bg-amber-100 px-1.5 py-0.5 rounded text-[10px] text-amber-700 font-bold">
                            <Star size={8} fill="currentColor" />
                            {doctor.rating}
                        </div>
                    </div>
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start">
                    <div className="pr-2">
                      <h3 className="font-bold text-slate-800 text-sm sm:text-base truncate group-hover:text-teal-700 transition-colors">
                        {doctor.name}
                      </h3>
                      <p className="text-slate-500 text-xs mt-0.5 truncate">{doctor.specialty}</p>
                    </div>
                  </div>
                  
                  <div className="mt-3 flex items-center gap-3 text-xs">
                    <div className="flex items-center gap-1.5 text-slate-500 bg-slate-50 px-2 py-1 rounded-md">
                        <Clock size={12} className="text-teal-500" />
                        <span className="truncate">{doctor.nextAvailable}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="mt-4 flex items-center gap-3 pt-3 border-t border-slate-50">
                 <div className="flex-1">
                    <span className="text-xs text-slate-400 block">Phí khám</span>
                    <span className="text-slate-800 font-bold text-sm">
                        {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(doctor.price)}
                    </span>
                 </div>
                <button 
                  onClick={() => onBook(doctor)}
                  className="flex-1 bg-slate-900 hover:bg-teal-600 text-white text-xs font-semibold py-2.5 rounded-xl transition-colors flex items-center justify-center gap-2 group-hover:shadow-lg group-hover:shadow-teal-100"
                >
                  Đặt lịch
                  <ChevronRight size={14} className="opacity-60" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
