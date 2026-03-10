import React, { useState, useEffect } from 'react';
import { Bed as BedIcon, Loader2 } from 'lucide-react';
import { Bed, BedAssignment } from '../types';
import { subscribeToBeds, subscribeToAssignments } from '../services/bedService';

export const PatientBedMap: React.FC = () => {
  const [beds, setBeds] = useState<Bed[]>([]);
  const [assignments, setAssignments] = useState<BedAssignment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubBeds = subscribeToBeds(setBeds);
    const unsubAssignments = subscribeToAssignments(setAssignments);
    setLoading(false);
    return () => {
      unsubBeds();
      unsubAssignments();
    };
  }, []);

  if (loading) return <div className="flex justify-center p-10"><Loader2 className="animate-spin text-teal-600" /></div>;

  return (
    <div className="space-y-8 animate-fade-in max-w-5xl mx-auto">
      <div className="text-center">
        <h2 className="text-3xl font-black text-slate-900">Sơ đồ Giường bệnh</h2>
        <p className="text-slate-500 mt-2">Theo dõi tình trạng giường bệnh nội trú tại bệnh viện.</p>
      </div>

      <div className="flex justify-center gap-6 mb-8">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-teal-100 border border-teal-200 rounded-md"></div>
          <span className="text-sm font-bold text-slate-600">Giường trống</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-slate-200 border border-slate-300 rounded-md"></div>
          <span className="text-sm font-bold text-slate-600">Đang sử dụng</span>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {beds.sort((a, b) => a.bedNumber.localeCompare(b.bedNumber)).map(bed => {
          const activeAssignment = assignments.find(a => a.bedId === bed.id && a.status === 'active');
          
          return (
            <div 
              key={bed.id}
              className={`relative group p-4 rounded-2xl border-2 transition-all flex flex-col items-center justify-center gap-2 h-32
                ${bed.status === 'available' 
                  ? 'bg-teal-50 border-teal-100' 
                  : 'bg-slate-100 border-slate-200'}`}
            >
              <BedIcon size={32} className={bed.status === 'available' ? 'text-teal-600' : 'text-slate-400'} />
              <span className={`font-black ${bed.status === 'available' ? 'text-teal-700' : 'text-slate-600'}`}>
                {bed.bedNumber}
              </span>
              
              {/* Secure Tooltip */}
              {bed.status === 'occupied' && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 bg-slate-900 text-white p-3 rounded-xl shadow-xl opacity-0 group-hover:opacity-100 pointer-events-none transition-all z-10 text-center">
                  <p className="text-[10px] font-bold mb-1">Giường đang được sử dụng</p>
                  {activeAssignment && (
                    <p className="text-[10px] text-teal-400 font-black">
                      Dự kiến xuất viện: {activeAssignment.expectedEndTime.split('T')[0].split('-').reverse().join('/')}
                    </p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {beds.length === 0 && (
        <div className="py-20 text-center bg-white rounded-[3rem] border border-dashed border-slate-200">
          <p className="text-slate-400 font-bold">Hiện chưa có thông tin giường bệnh nội trú.</p>
        </div>
      )}
    </div>
  );
};
