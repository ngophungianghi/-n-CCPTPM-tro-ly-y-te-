import React, { useState, useEffect, useMemo } from 'react';
import { 
  Plus, Trash2, CheckCircle, X, Loader2, 
  Bed as BedIcon, Calendar, Info,
  Clock, Search, UserPlus, AlertCircle
} from 'lucide-react';
import { Bed, BedAssignment, Booking, User } from '../types';
import { 
  subscribeToBeds, subscribeToAssignments, bulkCreateBeds, 
  deleteBed, assignBed, dischargePatient, getOccupancyForDate 
} from '../services/bedService';
import { fetchAllBookings, fetchAllUsers } from '../services/databaseService';

export const AdminBedManagement: React.FC = () => {
  const [beds, setBeds] = useState<Bed[]>([]);
  const [assignments, setAssignments] = useState<BedAssignment[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [bulkCount, setBulkCount] = useState(10);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedBed, setSelectedBed] = useState<Bed | null>(null);
  
  // Hybrid Input State
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userSearchTerm, setUserSearchTerm] = useState('');
  
  const [diagnosis, setDiagnosis] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [statsDate, setStatsDate] = useState(new Date().toISOString().split('T')[0]);
  const [stats, setStats] = useState({ occupied: 0, available: 0 });

  const todayStr = new Date().toISOString().split('T')[0];

  useEffect(() => {
    const unsubBeds = subscribeToBeds(setBeds);
    const unsubAssignments = subscribeToAssignments(setAssignments);
    
    fetchAllBookings().then(setBookings);
    fetchAllUsers().then(setUsers);
    
    setLoading(false);
    return () => {
      unsubBeds();
      unsubAssignments();
    };
  }, []);

  useEffect(() => {
    const checkAutoDischarge = async () => {
      const now = new Date().toISOString();
      const expiredActiveAssignments = assignments.filter(a => 
        a.status === 'active' && 
        a.expectedEndTime < now
      );

      for (const assignment of expiredActiveAssignments) {
        await dischargePatient(assignment.id, assignment.bedId);
      }
    };

    if (assignments.length > 0) {
      checkAutoDischarge();
    }
  }, [assignments]);

  useEffect(() => {
    const calculateStats = async () => {
      const occupiedOnDate = await getOccupancyForDate(statsDate);
      setStats({
        occupied: occupiedOnDate.length,
        available: beds.length - occupiedOnDate.length
      });
    };
    calculateStats();
  }, [statsDate, beds, assignments]);

  const recommendedPatients = useMemo(() => {
    return bookings.filter(b => 
      b.status === 'Đã hoàn thành' && 
      b.needsInpatient === true &&
      !b.isAdmitted
    );
  }, [bookings]);

  const filteredUsers = useMemo(() => {
    return users.filter(u => 
      u.role === 'customer' && 
      (u.fullName.toLowerCase().includes(userSearchTerm.toLowerCase()) || u.phone.includes(userSearchTerm))
    ).slice(0, 5);
  }, [users, userSearchTerm]);

  const handleBulkCreate = async () => {
    if (bulkCount <= 0) return;
    await bulkCreateBeds(bulkCount);
  };

  const handleAssign = async () => {
    if (!selectedBed || (!selectedBooking && !selectedUser) || !startTime || !endTime || !diagnosis) return;
    
    const patientId = selectedBooking ? selectedBooking.userPhone : selectedUser!.phone;
    const patientName = selectedBooking ? selectedBooking.userFullName : selectedUser!.fullName;
    const isEmergency = !!selectedUser;

    await assignBed({
      bedId: selectedBed.id,
      patientId,
      patientName,
      diagnosis,
      startTime,
      expectedEndTime: endTime,
      status: 'active',
      isEmergency
    }, selectedBooking?.id);
    
    setShowAssignModal(false);
    resetForm();
  };

  const resetForm = () => {
    setSelectedBed(null);
    setSelectedBooking(null);
    setSelectedUser(null);
    setDiagnosis('');
    setStartTime('');
    setEndTime('');
    setUserSearchTerm('');
  };

  const activeAssignments = useMemo(() => {
    return assignments.filter(a => a.status === 'active');
  }, [assignments]);

  const getAssignmentForBed = (bedId: string) => {
    return activeAssignments.find(a => a.bedId === bedId);
  };

  if (loading) return <div className="flex justify-center p-10"><Loader2 className="animate-spin text-teal-600" /></div>;

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header & Stats */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
        <div>
          <h2 className="text-3xl font-black text-slate-900">Quản lý Giường bệnh</h2>
          <p className="text-slate-500 mt-1">Theo dõi và sắp xếp giường nội trú cho bệnh nhân.</p>
        </div>
        
        <div className="flex flex-wrap gap-4">
          <div className="bg-teal-50 px-6 py-3 rounded-2xl border border-teal-100">
            <p className="text-xs font-bold text-teal-600 uppercase tracking-wider">Trống</p>
            <p className="text-2xl font-black text-teal-700">{beds.filter(b => b.status === 'available').length}</p>
          </div>
          <div className="bg-slate-50 px-6 py-3 rounded-2xl border border-slate-100">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Đang sử dụng</p>
            <p className="text-2xl font-black text-slate-700">{beds.filter(b => b.status === 'occupied').length}</p>
          </div>
        </div>
      </div>

      {/* Bulk Create & Date Filter */}
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col md:flex-row items-center gap-4">
          <div className="flex-1 w-full">
            <label className="text-xs font-bold text-slate-400 uppercase ml-1">Tạo giường hàng loạt</label>
            <div className="flex gap-2 mt-1">
              <input 
                type="number" 
                value={bulkCount} 
                onChange={(e) => setBulkCount(parseInt(e.target.value))}
                className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 outline-none focus:border-teal-500"
                placeholder="Số lượng giường..."
              />
              <button 
                onClick={handleBulkCreate}
                className="bg-slate-900 text-white px-6 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-teal-600 transition-all"
              >
                <Plus size={18} /> Tạo
              </button>
            </div>
          </div>
          
          <div className="w-full md:w-auto">
            <label className="text-xs font-bold text-slate-400 uppercase ml-1">Kiểm tra trạng thái ngày</label>
            <div className="flex gap-2 mt-1">
              <input 
                type="date" 
                min={todayStr}
                value={statsDate} 
                onChange={(e) => setStatsDate(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 outline-none focus:border-teal-500"
              />
            </div>
          </div>
        </div>

        <div className="bg-teal-600 text-white p-6 rounded-[2rem] shadow-lg flex items-center justify-between">
          <div>
            <p className="text-sm font-bold opacity-80">Dự kiến ngày {statsDate.split('-').reverse().join('/')}</p>
            <p className="text-3xl font-black mt-1">{stats.available} giường trống</p>
          </div>
          <div className="bg-white/20 p-3 rounded-2xl">
            <Calendar size={32} />
          </div>
        </div>
      </div>

      {/* Bed Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4">
        {beds.sort((a, b) => a.bedNumber.localeCompare(b.bedNumber)).map(bed => {
          const assignment = getAssignmentForBed(bed.id);
          return (
            <div 
              key={bed.id}
              className={`relative group p-4 rounded-2xl border-2 transition-all cursor-pointer flex flex-col items-center justify-center gap-2 h-32
                ${bed.status === 'available' 
                  ? 'bg-teal-50 border-teal-100 hover:border-teal-300' 
                  : 'bg-slate-100 border-slate-200 hover:border-slate-300'}`}
              onClick={() => {
                if (bed.status === 'available') {
                  setSelectedBed(bed);
                  setShowAssignModal(true);
                }
              }}
            >
              <BedIcon size={32} className={bed.status === 'available' ? 'text-teal-600' : 'text-slate-400'} />
              <span className={`font-black ${bed.status === 'available' ? 'text-teal-700' : 'text-slate-600'}`}>
                {bed.bedNumber}
              </span>
              
              {/* Tooltip on Hover */}
              {bed.status === 'occupied' && assignment && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 bg-slate-900 text-white p-4 rounded-2xl shadow-2xl opacity-0 group-hover:opacity-100 pointer-events-none transition-all z-20">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center font-bold text-xs">
                      {assignment.patientName[0]}
                    </div>
                    <div>
                      <p className="font-bold text-sm">{assignment.patientName}</p>
                      <p className="text-[10px] opacity-60">BN: {assignment.patientId}</p>
                    </div>
                  </div>
                  <div className="space-y-1 text-xs">
                    <p><span className="opacity-60">Chẩn đoán:</span> {assignment.diagnosis}</p>
                    <p><span className="opacity-60">Dự kiến xuất viện:</span> {assignment.expectedEndTime.split('T')[0].split('-').reverse().join('/')}</p>
                  </div>
                  <div className="mt-3 pt-3 border-t border-white/10 flex justify-between items-center">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        dischargePatient(assignment.id, bed.id);
                      }}
                      className="pointer-events-auto text-[10px] font-bold bg-red-500 hover:bg-red-600 px-3 py-1 rounded-lg transition-colors"
                    >
                      Xuất viện
                    </button>
                  </div>
                </div>
              )}

              {/* Delete Bed Icon */}
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  if (window.confirm("Xóa giường này?")) deleteBed(bed.id);
                }}
                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 transition-all"
              >
                <Trash2 size={14} />
              </button>
            </div>
          );
        })}
      </div>

      {/* Assign Modal */}
      {showAssignModal && selectedBed && (
        <div className="fixed inset-0 z-[150] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-[3rem] w-full max-w-2xl p-8 animate-slide-up shadow-2xl overflow-y-auto max-h-[90vh] scrollbar-hide">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-black text-slate-900">Xếp giường {selectedBed.bedNumber}</h3>
              <button onClick={() => { setShowAssignModal(false); resetForm(); }} className="p-2 bg-slate-100 rounded-full hover:bg-slate-200">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-8">
              {/* Hybrid Input Section */}
              <div className="grid md:grid-cols-2 gap-8 relative">
                {/* Option 1: From Appointments */}
                <div className={`${selectedUser ? 'opacity-30 pointer-events-none' : ''} transition-all`}>
                  <div className="flex justify-between items-center mb-3">
                    <label className="text-xs font-bold text-slate-400 uppercase ml-1">Lựa chọn 1: Từ chỉ định</label>
                    {selectedBooking && (
                      <button onClick={() => setSelectedBooking(null)} className="text-[10px] font-bold text-red-500 hover:underline">Xóa chọn</button>
                    )}
                  </div>
                  <div className="grid gap-2 max-h-48 overflow-y-auto pr-2 scrollbar-hide">
                    {recommendedPatients.length > 0 ? recommendedPatients.map(p => (
                      <button 
                        key={p.id}
                        onClick={() => {
                          setSelectedBooking(p);
                          setDiagnosis(p.prescription?.note || p.aiSummary || '');
                        }}
                        className={`flex items-center justify-between p-4 rounded-2xl border-2 transition-all text-left
                          ${selectedBooking?.id === p.id ? 'border-teal-500 bg-teal-50' : 'border-slate-100 hover:border-slate-200'}`}
                      >
                        <div>
                          <p className="font-bold text-slate-800">{p.userFullName}</p>
                          <p className="text-[10px] text-slate-400 mt-1">{p.aiSummary || 'Khám tổng quát'}</p>
                        </div>
                        {selectedBooking?.id === p.id && <CheckCircle size={18} className="text-teal-600" />}
                      </button>
                    )) : (
                      <p className="text-sm text-slate-400 italic p-4 text-center bg-slate-50 rounded-2xl">Không có bệnh nhân chờ nhập viện.</p>
                    )}
                  </div>
                </div>

                {/* Divider */}
                <div className="hidden md:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-2 py-1 z-10">
                  <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">--- HOẶC ---</span>
                </div>
                <div className="md:hidden flex justify-center py-2">
                  <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">--- HOẶC ---</span>
                </div>

                {/* Option 2: Direct Input */}
                <div className={`${selectedBooking ? 'opacity-30 pointer-events-none' : ''} transition-all`}>
                  <div className="flex justify-between items-center mb-3">
                    <label className="text-xs font-bold text-slate-400 uppercase ml-1">Lựa chọn 2: Nhập trực tiếp</label>
                    {selectedUser && (
                      <button onClick={() => { setSelectedUser(null); setUserSearchTerm(''); }} className="text-[10px] font-bold text-red-500 hover:underline">Xóa chọn</button>
                    )}
                  </div>
                  <div className="relative mb-3">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input 
                      type="text"
                      value={userSearchTerm}
                      onChange={(e) => setUserSearchTerm(e.target.value)}
                      placeholder="Tìm tên hoặc SĐT..."
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-11 pr-4 py-3 outline-none focus:border-teal-500 text-sm"
                    />
                  </div>
                  <div className="grid gap-2">
                    {userSearchTerm && filteredUsers.map(u => (
                      <button 
                        key={u.phone}
                        onClick={() => setSelectedUser(u)}
                        className={`flex items-center justify-between p-4 rounded-2xl border-2 transition-all text-left
                          ${selectedUser?.phone === u.phone ? 'border-teal-500 bg-teal-50' : 'border-slate-100 hover:border-slate-200'}`}
                      >
                        <div>
                          <p className="font-bold text-slate-800">{u.fullName}</p>
                          <p className="text-[10px] text-slate-400 mt-1">{u.phone}</p>
                        </div>
                        {selectedUser?.phone === u.phone ? <CheckCircle size={18} className="text-teal-600" /> : <UserPlus size={18} className="text-slate-300" />}
                      </button>
                    ))}
                    {!userSearchTerm && !selectedUser && (
                      <div className="p-8 border-2 border-dashed border-slate-100 rounded-2xl flex flex-col items-center justify-center text-slate-300">
                        <Search size={24} />
                        <p className="text-[10px] font-bold mt-2">Nhập để tìm bệnh nhân</p>
                      </div>
                    )}
                    {selectedUser && !userSearchTerm && (
                       <div className="p-4 border-2 border-teal-500 bg-teal-50 rounded-2xl flex items-center justify-between">
                          <div>
                            <p className="font-bold text-slate-800">{selectedUser.fullName}</p>
                            <p className="text-[10px] text-slate-400">{selectedUser.phone}</p>
                          </div>
                          <CheckCircle size={18} className="text-teal-600" />
                       </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Time & Diagnosis Section */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase ml-1">Từ ngày</label>
                  <input 
                    type="datetime-local" 
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full mt-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-teal-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase ml-1">Đến ngày (Dự kiến)</label>
                  <input 
                    type="datetime-local" 
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full mt-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-teal-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 uppercase ml-1">Chẩn đoán nội trú</label>
                <textarea 
                  value={diagnosis}
                  onChange={(e) => setDiagnosis(e.target.value)}
                  placeholder="Nhập chẩn đoán chi tiết..."
                  className="w-full mt-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-teal-500 h-24 resize-none"
                />
              </div>

              {selectedUser && (
                <div className="bg-amber-50 border border-amber-100 p-4 rounded-2xl flex items-start gap-3">
                  <AlertCircle className="text-amber-600 shrink-0" size={18} />
                  <p className="text-xs text-amber-700 leading-relaxed">
                    <strong>Lưu ý:</strong> Bạn đang chọn nhập viện trực tiếp. Hệ thống sẽ đánh dấu đây là trường hợp <strong>Cấp cứu/Nhập viện thẳng</strong>.
                  </p>
                </div>
              )}

              <button 
                disabled={(!selectedBooking && !selectedUser) || !startTime || !endTime || !diagnosis}
                onClick={handleAssign}
                className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black shadow-xl hover:bg-teal-600 transition-all disabled:opacity-30"
              >
                Xác nhận Xếp giường
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
