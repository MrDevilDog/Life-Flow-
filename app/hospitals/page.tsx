"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Building2, Search, Filter, ArrowUpDown, MapPin } from "lucide-react"

// Realistically generated mock data for Mumbai hospitals
const MOCK_HOSPITALS = [
  {
    id: 1,
    name: "Lilavati Hospital",
    location: "Bandra West, Mumbai",
    inventory: { "A+": 25, "A-": 10, "B+": 30, "B-": 5, "O+": 40, "O-": 8, "AB+": 12, "AB-": 3 }
  },
  {
    id: 2,
    name: "Kokilaben Dhirubhai Ambani Hospital",
    location: "Andheri West, Mumbai",
    inventory: { "A+": 55, "A-": 20, "B+": 50, "B-": 15, "O+": 80, "O-": 25, "AB+": 30, "AB-": 10 }
  },
  {
    id: 3,
    name: "Tata Memorial Hospital",
    location: "Parel, Mumbai",
    inventory: { "A+": 18, "A-": 5, "B+": 22, "B-": 3, "O+": 28, "O-": 6, "AB+": 10, "AB-": 2 }
  },
  {
    id: 4,
    name: "KEM Hospital",
    location: "Parel, Mumbai",
    inventory: { "A+": 45, "A-": 12, "B+": 35, "B-": 8, "O+": 60, "O-": 15, "AB+": 20, "AB-": 6 }
  },
  {
    id: 5,
    name: "Nanavati Max Super Speciality Hospital",
    location: "Vile Parle West, Mumbai",
    inventory: { "A+": 5, "A-": 1, "B+": 8, "B-": 0, "O+": 10, "O-": 2, "AB+": 3, "AB-": 1 }
  },
  {
    id: 6,
    name: "Bombay Hospital",
    location: "Marine Lines, Mumbai",
    inventory: { "A+": 30, "A-": 8, "B+": 25, "B-": 6, "O+": 45, "O-": 12, "AB+": 15, "AB-": 4 }
  },
  {
    id: 7,
    name: "Jaslok Hospital",
    location: "Pedder Road, Mumbai",
    inventory: { "A+": 15, "A-": 4, "B+": 20, "B-": 2, "O+": 35, "O-": 5, "AB+": 8, "AB-": 1 }
  },
  {
    id: 8,
    name: "Hinduja Hospital",
    location: "Mahim, Mumbai",
    inventory: { "A+": 12, "A-": 3, "B+": 15, "B-": 1, "O+": 18, "O-": 4, "AB+": 6, "AB-": 1 }
  },
  {
    id: 9,
    name: "Fortis Hospital",
    location: "Mulund West, Mumbai",
    inventory: { "A+": 8, "A-": 2, "B+": 12, "B-": 1, "O+": 15, "O-": 3, "AB+": 5, "AB-": 0 }
  },
  {
    id: 10,
    name: "SevenHills Hospital",
    location: "Andheri East, Mumbai",
    inventory: { "A+": 22, "A-": 7, "B+": 18, "B-": 4, "O+": 32, "O-": 9, "AB+": 14, "AB-": 2 }
  }
];

const BLOOD_TYPES = ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"];
// Extract unique area names from "Area, Mumbai" format
const LOCATIONS = Array.from(new Set(MOCK_HOSPITALS.map(h => h.location.split(',')[0].trim()))).sort();

export default function HospitalsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [bloodTypeFilter, setBloodTypeFilter] = useState("ALL");
  const [locationFilter, setLocationFilter] = useState("ALL");
  const [sortBy, setSortBy] = useState("total-desc");

  // Determine stock level color based on new requirements
  const getStockColor = (units: number) => {
    if (units === 0) return "bg-slate-100 text-slate-400 border-slate-200 outline-slate-300 opacity-60"; // Out of stock
    if (units < 10) return "bg-red-50 text-red-700 border-red-200"; // Low stock (<10)
    if (units <= 30) return "bg-yellow-50 text-yellow-700 border-yellow-200"; // Medium stock (10-30)
    return "bg-green-50 text-green-700 border-green-200"; // High stock (>30)
  };

  const getStockIndicator = (units: number) => {
    if (units === 0) return "⚫";
    if (units < 10) return "🔴";
    if (units <= 30) return "🟡";
    return "🟢";
  };

  // Filter and sort logic
  const filteredAndSortedHospitals = useMemo(() => {
    let result = [...MOCK_HOSPITALS];

    // Filter by Search (Hospital Name)
    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      result = result.filter((h) =>
        h.name.toLowerCase().includes(lowerSearch)
      );
    }

    // Filter by Location
    if (locationFilter !== "ALL") {
      result = result.filter((h) => h.location.includes(locationFilter));
    }

    // Filter by Blood Type (only show hospitals that have > 0 of selected type)
    if (bloodTypeFilter !== "ALL") {
      result = result.filter(
        (h) => h.inventory[bloodTypeFilter as keyof typeof h.inventory] > 0
      );
    }

    // Sort
    result.sort((a, b) => {
      // If a specific blood type is selected, sort based on that unit count
      if (bloodTypeFilter !== "ALL") {
        const unitsA = a.inventory[bloodTypeFilter as keyof typeof a.inventory];
        const unitsB = b.inventory[bloodTypeFilter as keyof typeof b.inventory];
        
        if (sortBy === "avail-desc") return unitsB - unitsA;
        if (sortBy === "avail-asc") return unitsA - unitsB;
      }
      
      // Calculate total units
      const totalA = Object.values(a.inventory).reduce((acc, curr) => acc + curr, 0);
      const totalB = Object.values(b.inventory).reduce((acc, curr) => acc + curr, 0);

      if (sortBy === "total-desc" || sortBy === "avail-desc") return totalB - totalA;
      if (sortBy === "total-asc" || sortBy === "avail-asc") return totalA - totalB;
      if (sortBy === "name-asc") return a.name.localeCompare(b.name);
      if (sortBy === "name-desc") return b.name.localeCompare(a.name);
      
      return 0;
    });

    return result;
  }, [searchTerm, bloodTypeFilter, locationFilter, sortBy]);

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-red-950 via-red-900 to-red-800 text-white pt-16 pb-24 px-6 md:px-12 border-b border-red-950/20 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-red-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
        <div className="absolute bottom-0 left-20 w-72 h-72 bg-orange-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20"></div>
        
        <div className="container max-w-7xl mx-auto relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex flex-col gap-2">
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight flex items-center gap-3 drop-shadow-md">
              <Building2 className="h-10 w-10 text-red-200" />
              Hospital Blood Inventory
            </h1>
            <p className="text-red-100/90 text-lg md:text-xl max-w-2xl mt-2 font-medium">
              Real-time monitor of available blood units across our network of registered hospitals in Mumbai.
            </p>
          </div>
          <div className="hidden md:flex items-center gap-4 bg-white/10 px-6 py-4 rounded-2xl backdrop-blur-sm border border-white/10">
             <div className="text-center">
               <p className="text-3xl font-black text-white">{MOCK_HOSPITALS.length}</p>
               <p className="text-xs text-red-200 font-semibold uppercase tracking-wider">Hospitals</p>
             </div>
             <div className="w-px h-10 bg-white/20"></div>
             <div className="text-center">
               <p className="text-3xl font-black text-white">
                 {MOCK_HOSPITALS.reduce((acc, h) => acc + Object.values(h.inventory).reduce((a, b) => a + b, 0), 0)}
               </p>
               <p className="text-xs text-red-200 font-semibold uppercase tracking-wider">Total Units</p>
             </div>
          </div>
        </div>
      </div>

      <div className="container max-w-7xl mx-auto px-4 sm:px-6 -mt-10 relative z-20">
        {/* Search & Filter Controls */}
        <Card className="border-border shadow-xl shadow-red-900/5 mb-8 rounded-2xl overflow-hidden glassmorphism bg-white/95 backdrop-blur-md">
          <CardContent className="p-6">
            <div className="grid gap-6 md:grid-cols-12 items-end">
              
              <div className="flex flex-col gap-2 md:col-span-3">
                <Label htmlFor="search" className="text-xs font-bold uppercase tracking-wider text-slate-500">Search Hospitals</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                  <Input
                    id="search"
                    placeholder="E.g. Lilavati Hospital..."
                    className="pl-10 py-6 text-base font-medium rounded-xl border-slate-200 shadow-inner bg-slate-50 focus:bg-white transition-colors"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2 md:col-span-3">
                <Label htmlFor="location" className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" /> Filter by Location
                </Label>
                <Select value={locationFilter} onValueChange={setLocationFilter}>
                  <SelectTrigger id="location" className="py-6 rounded-xl border-slate-200 font-medium text-base bg-white shadow-sm">
                    <SelectValue placeholder="All Locations" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL" className="font-semibold">All Locations</SelectItem>
                    {LOCATIONS.map((loc) => (
                      <SelectItem key={loc} value={loc} className="font-medium">
                        {loc}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-2 md:col-span-3">
                <Label htmlFor="blood-type" className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
                  <DropletIcon className="w-3.5 h-3.5 text-red-500" /> Filter by Blood Type
                </Label>
                <Select value={bloodTypeFilter} onValueChange={setBloodTypeFilter}>
                  <SelectTrigger id="blood-type" className="py-6 rounded-xl border-slate-200 font-medium text-base bg-white shadow-sm">
                    <SelectValue placeholder="All Blood Types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL" className="font-semibold">All Blood Types</SelectItem>
                    {BLOOD_TYPES.map((type) => (
                      <SelectItem key={type} value={type} className="font-semibold text-red-600">
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-2 md:col-span-3">
                <Label htmlFor="sort" className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
                  <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" /> Sort By
                </Label>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger id="sort" className="py-6 rounded-xl border-slate-200 font-medium text-base bg-white shadow-sm">
                    <SelectValue placeholder="Sort order" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="total-desc">Highest Stock First</SelectItem>
                    <SelectItem value="total-asc">Lowest Stock First</SelectItem>
                    <SelectItem value="name-asc">Name (A-Z)</SelectItem>
                    <SelectItem value="name-desc">Name (Z-A)</SelectItem>
                    {bloodTypeFilter !== "ALL" && (
                      <>
                        <SelectItem value="avail-desc">Highest {bloodTypeFilter} First</SelectItem>
                        <SelectItem value="avail-asc">Lowest {bloodTypeFilter} First</SelectItem>
                      </>
                    )}
                  </SelectContent>
                </Select>
              </div>

            </div>
          </CardContent>
        </Card>

        {/* Legend */}
        <div className="flex flex-wrap items-center justify-end gap-5 mb-6 px-2">
          <span className="text-sm font-semibold text-slate-500 uppercase tracking-widest mr-2">Stock Levels:</span>
          <div className="flex items-center gap-2 text-sm font-medium"><span className="w-3 h-3 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]"></span> High (&gt;30)</div>
          <div className="flex items-center gap-2 text-sm font-medium"><span className="w-3 h-3 rounded-full bg-yellow-400 shadow-[0_0_8px_rgba(250,204,21,0.5)]"></span> Medium (10-30)</div>
          <div className="flex items-center gap-2 text-sm font-medium"><span className="w-3 h-3 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]"></span> Low (&lt;10)</div>
        </div>

        {/* Hospital Grid */}
        {filteredAndSortedHospitals.length === 0 ? (
          <Card className="border-dashed border-2 py-20 bg-slate-50">
            <CardContent className="flex flex-col items-center justify-center text-center">
              <Filter className="w-16 h-16 text-slate-300 mb-4" />
              <h3 className="text-xl font-bold text-slate-700">No hospitals found</h3>
              <p className="text-slate-500 mt-2 max-w-md">No hospitals currently match your search criteria. Try adjusting your filters.</p>
              <Button 
                variant="outline" 
                className="mt-6 border-red-200 text-red-600 hover:bg-red-50 font-semibold"
                onClick={() => { setSearchTerm(""); setBloodTypeFilter("ALL"); setLocationFilter("ALL"); }}
              >
                Clear Filters
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {filteredAndSortedHospitals.map((hospital, idx) => {
              const totalUnits = Object.values(hospital.inventory).reduce((a, b) => a + b, 0);

              return (
                <div 
                  key={hospital.name} 
                  className="group animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both"
                  style={{ animationDelay: `${idx * 50}ms` }}
                >
                  <Card className="h-full border border-slate-200 hover:border-red-300 transition-all duration-300 shadow-sm hover:shadow-xl hover:shadow-red-900/10 rounded-2xl overflow-hidden bg-white">
                    <div className="h-2 w-full bg-gradient-to-r from-red-600 to-red-400 opacity-80"></div>
                    <CardHeader className="pb-4 pt-5">
                      <div className="flex justify-between items-start gap-4">
                        <div>
                          <CardTitle className="text-xl font-bold text-slate-800 leading-tight group-hover:text-red-700 transition-colors">
                            {hospital.name}
                          </CardTitle>
                          <CardDescription className="text-sm mt-1.5 flex items-center gap-1.5 font-medium text-slate-500">
                            <span className="bg-slate-100 p-1 rounded">📍</span> {hospital.location}
                          </CardDescription>
                        </div>
                        <Badge variant="secondary" className="px-3 py-1 font-bold text-sm bg-slate-100 text-slate-700 shrink-0 border-slate-200 shadow-sm">
                          {totalUnits} Units
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-4 gap-3">
                        {BLOOD_TYPES.map((type) => {
                          const units = hospital.inventory[type as keyof typeof hospital.inventory];
                          const isSelected = type === bloodTypeFilter;
                          const opacity = bloodTypeFilter !== "ALL" && !isSelected ? "opacity-30 grayscale saturate-0" : "opacity-100";
                          const ring = isSelected ? "ring-2 ring-red-500 ring-offset-1 shadow-md scale-[1.02]" : "";
                          
                          return (
                            <div 
                              key={type} 
                              className={`flex flex-col items-center justify-center p-2.5 rounded-xl border transition-all duration-200 ${getStockColor(units)} ${opacity} ${ring} ${units > 0 ? "shadow-sm hover:scale-105 cursor-default" : ""}`}
                            >
                              <span className="font-black text-sm md:text-base tracking-tighter mb-1 flex items-center gap-0.5">
                                <span className={units === 0 ? "grayscale opacity-50" : ""}>🩸</span> {type}
                              </span>
                              <div className="flex items-center gap-1">
                                <span className="text-lg font-bold leading-none">{units}</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  )
}

function DropletIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="currentColor"
      stroke="none"
    >
      <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 12 2 12 2C12 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" />
    </svg>
  )
}
