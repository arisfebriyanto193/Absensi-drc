"use client";

import React, { useState, useRef, useEffect } from "react";
import { Search, ChevronDown } from "lucide-react";

interface Option {
  value: string | number;
  label: string;
}

interface SearchableSelectProps {
  options: Option[];
  value: string | number;
  onChange: (value: string | number) => void;
  placeholder?: string;
  required?: boolean;
}

export default function SearchableSelect({ options, value, onChange, placeholder = "-- Pilih --", required = false }: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredOptions = options.filter(option => 
    option.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedOption = options.find(opt => opt.value == value);

  return (
    <div ref={wrapperRef} style={{ position: "relative", width: "100%" }}>
      {/* Hidden input just to support "required" attribute for forms */}
      <input 
        type="text" 
        value={value} 
        onChange={() => {}} 
        required={required} 
        style={{ position: "absolute", opacity: 0, height: 0, width: 0, pointerEvents: "none" }} 
      />
      
      <div 
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          width: "100%", 
          padding: "10px", 
          borderRadius: "8px", 
          border: isOpen ? "1px solid var(--primary)" : "1px solid var(--border)", 
          backgroundColor: "var(--bg-color)", 
          color: selectedOption ? "var(--text-main)" : "var(--text-muted)",
          cursor: "pointer",
          boxShadow: isOpen ? "0 0 0 2px rgba(79, 172, 254, 0.2)" : "none"
        }}
      >
        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown size={16} style={{ transform: isOpen ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }} />
      </div>

      {isOpen && (
        <div style={{
          position: "absolute",
          top: "100%",
          left: 0,
          right: 0,
          marginTop: "4px",
          backgroundColor: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: "8px",
          boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
          zIndex: 50,
          maxHeight: "250px",
          display: "flex",
          flexDirection: "column"
        }}>
          <div style={{ padding: "8px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: "8px" }}>
            <Search size={16} color="var(--text-muted)" />
            <input 
              type="text"
              autoFocus
              placeholder="Cari..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: "100%",
                border: "none",
                outline: "none",
                backgroundColor: "transparent",
                color: "var(--text-main)",
                fontSize: "0.9rem"
              }}
            />
          </div>
          
          <div style={{ overflowY: "auto", flex: 1, padding: "4px 0" }}>
            {filteredOptions.length > 0 ? (
              filteredOptions.map(option => (
                <div
                  key={option.value}
                  onClick={() => {
                    onChange(option.value);
                    setIsOpen(false);
                    setSearchTerm("");
                  }}
                  style={{
                    padding: "10px 12px",
                    cursor: "pointer",
                    backgroundColor: option.value == value ? "rgba(79, 172, 254, 0.1)" : "transparent",
                    color: option.value == value ? "var(--primary)" : "var(--text-main)",
                    fontWeight: option.value == value ? "600" : "normal",
                    fontSize: "0.9rem"
                  }}
                  onMouseOver={(e) => {
                    if (option.value != value) e.currentTarget.style.backgroundColor = "rgba(0,0,0,0.02)";
                  }}
                  onMouseOut={(e) => {
                    if (option.value != value) e.currentTarget.style.backgroundColor = "transparent";
                  }}
                >
                  {option.label}
                </div>
              ))
            ) : (
              <div style={{ padding: "12px", textAlign: "center", color: "var(--text-muted)", fontSize: "0.9rem" }}>
                Tidak ditemukan
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
