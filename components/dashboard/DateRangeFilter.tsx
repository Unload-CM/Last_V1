"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "../../components/ui/button";
import { Calendar } from "../../components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "../../components/ui/popover";
import { format, startOfMonth, endOfMonth, subMonths, addMonths } from "date-fns";
import { ko } from "date-fns/locale";
import { CalendarIcon, ChevronDown } from "lucide-react";
import React from "react";
import { useTranslation } from "@/store/languageStore";
import { useMediaQuery } from 'react-responsive';

interface DateRangeFilterProps {
  onFilterChange: (from: Date, to: Date) => void;
  initialFromDate?: Date;
  initialToDate?: Date;
}

export default function DateRangeFilter({ onFilterChange, initialFromDate, initialToDate }: DateRangeFilterProps) {
  const { t } = useTranslation();
  const today = new Date();
  const [fromDate, setFromDate] = useState<Date>(initialFromDate || startOfMonth(today));
  const [toDate, setToDate] = useState<Date>(initialToDate || today);
  const [fromOpen, setFromOpen] = useState(false);
  const [toOpen, setToOpen] = useState(false);
  const [periodOpen, setPeriodOpen] = useState(false);

  // 날짜 변경 시 상위 컴포넌트에 알림 - 초기 렌더링 시 호출하지 않기 위한 ref
  const initialRender = React.useRef(true);
  const prevFromDate = React.useRef(fromDate);
  const prevToDate = React.useRef(toDate);
  const filterChangeTimeout = React.useRef<NodeJS.Timeout | null>(null);
  const pendingChange = React.useRef(false);

  // 모바일 여부 확인
  const isMobile = useMediaQuery({ maxWidth: 768 });

  // 메모이제이션된 필터 변경 함수 - 디바운스 처리
  const notifyFilterChange = useCallback(() => {
    // 이전 값과 현재 값 비교
    if (
      prevFromDate.current.getTime() !== fromDate.getTime() ||
      prevToDate.current.getTime() !== toDate.getTime()
    ) {
      pendingChange.current = true;

      // 이전 타이머가 있다면 취소
      if (filterChangeTimeout.current) {
        clearTimeout(filterChangeTimeout.current);
      }

      // 500ms 디바운스 적용
      filterChangeTimeout.current = setTimeout(() => {
        // 값 업데이트
        prevFromDate.current = fromDate;
        prevToDate.current = toDate;
        onFilterChange(fromDate, toDate);
        pendingChange.current = false;
        filterChangeTimeout.current = null;
      }, 500);
    }
  }, [fromDate, toDate, onFilterChange]);

  // 컴포넌트 언마운트 시 타이머 정리
  useEffect(() => {
    return () => {
      if (filterChangeTimeout.current) {
        clearTimeout(filterChangeTimeout.current);
      }
    };
  }, []);

  useEffect(() => {
    // 초기 렌더링이면 호출하지 않고 넘어가기
    if (initialRender.current) {
      initialRender.current = false;
      prevFromDate.current = fromDate;
      prevToDate.current = toDate;
      
      // 초기 렌더링 시에도 날짜 변경 이벤트 발생시키기
      onFilterChange(fromDate, toDate);
      return;
    }
    
    // 값이 변경되었을 때만 알림
    notifyFilterChange();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fromDate, toDate]);

  // 초기값이 변경되면 상태 업데이트
  useEffect(() => {
    if (initialFromDate) {
      setFromDate(initialFromDate);
      prevFromDate.current = initialFromDate;
    }
    if (initialToDate) {
      setToDate(initialToDate);
      prevToDate.current = initialToDate;
    }
  }, [initialFromDate, initialToDate]);

  // 날짜 형식 포맷
  const formatDate = (date: Date) => {
    // 모바일에서는 'yy.MM.dd' 형식으로, 데스크톱에서는 'yyyy-MM-dd' 형식으로 표시
    return format(date, isMobile ? 'yy.MM.dd' : 'yyyy-MM-dd', { locale: ko });
  };

  // FROM 날짜 변경 핸들러
  const handleFromDateChange = (date: Date | undefined) => {
    if (date) {
      // 시작 시간을 00:00:00으로 설정
      date.setHours(0, 0, 0, 0);
      
      // FROM 날짜가 TO 날짜보다 늦으면 TO 날짜를 FROM 날짜로 설정
      if (date > toDate) {
        // 종료 시간을 23:59:59.999로 설정
        const newToDate = new Date(date);
        newToDate.setHours(23, 59, 59, 999);
        setToDate(newToDate);
      }
      setFromDate(date);
      setFromOpen(false);
    }
  };

  // TO 날짜 변경 핸들러
  const handleToDateChange = (date: Date | undefined) => {
    if (date) {
      // 종료 시간을 23:59:59.999로 설정
      date.setHours(23, 59, 59, 999);
      
      // TO 날짜가 FROM 날짜보다 이르면 FROM 날짜를 TO 날짜로 설정
      if (date < fromDate) {
        // 시작 시간을 00:00:00으로 설정
        const newFromDate = new Date(date);
        newFromDate.setHours(0, 0, 0, 0);
        setFromDate(newFromDate);
      }
      setToDate(date);
      setToOpen(false);
    }
  };

  // 기간 프리셋 핸들러
  const handlePeriodSelect = (period: string) => {
    switch (period) {
      case "today":
        const todayStart = new Date(today);
        todayStart.setHours(0, 0, 0, 0);
        
        const todayEnd = new Date(today);
        todayEnd.setHours(23, 59, 59, 999);
        
        setFromDate(todayStart);
        setToDate(todayEnd);
        break;
      case "thisWeek":
        const thisWeekStart = new Date(today);
        thisWeekStart.setDate(today.getDate() - today.getDay());
        thisWeekStart.setHours(0, 0, 0, 0);
        
        const thisWeekEnd = new Date(today);
        thisWeekEnd.setHours(23, 59, 59, 999);
        
        setFromDate(thisWeekStart);
        setToDate(thisWeekEnd);
        break;
      case "thisMonth":
        const thisMonthStart = startOfMonth(today);
        thisMonthStart.setHours(0, 0, 0, 0);
        
        const thisMonthEnd = new Date(today);
        thisMonthEnd.setHours(23, 59, 59, 999);
        
        setFromDate(thisMonthStart);
        setToDate(thisMonthEnd);
        break;
      case "lastMonth":
        const lastMonth = subMonths(today, 1);
        const lastMonthStart = startOfMonth(lastMonth);
        lastMonthStart.setHours(0, 0, 0, 0);
        
        const lastMonthEnd = endOfMonth(lastMonth);
        lastMonthEnd.setHours(23, 59, 59, 999);
        
        setFromDate(lastMonthStart);
        setToDate(lastMonthEnd);
        break;
      case "last3Months":
        const last3Months = subMonths(today, 3);
        const last3MonthsStart = startOfMonth(last3Months);
        last3MonthsStart.setHours(0, 0, 0, 0);
        
        const last3MonthsEnd = new Date(today);
        last3MonthsEnd.setHours(23, 59, 59, 999);
        
        setFromDate(last3MonthsStart);
        setToDate(last3MonthsEnd);
        break;
      case "thisYear":
        const thisYearStart = new Date(today.getFullYear(), 0, 1);
        thisYearStart.setHours(0, 0, 0, 0);
        
        const thisYearEnd = new Date(today);
        thisYearEnd.setHours(23, 59, 59, 999);
        
        setFromDate(thisYearStart);
        setToDate(thisYearEnd);
        break;
    }
    setPeriodOpen(false);
  };

  return (
    <div className="flex flex-wrap items-center gap-1 -mt-1">
      <div className="flex items-center space-x-1 md:space-x-2">
        <Popover open={fromOpen} onOpenChange={setFromOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className="flex items-center justify-between w-[110px] md:w-[130px] h-7 md:h-8 py-0 md:py-1 text-xs"
              size="sm"
            >
              <CalendarIcon className="mr-1 h-3 w-3 md:h-3.5 md:w-3.5" />
              <span className="text-xs truncate">{formatDate(fromDate)}</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={fromDate}
              onSelect={handleFromDateChange}
              initialFocus
              locale={ko}
            />
          </PopoverContent>
        </Popover>
        <span className="text-xs">~</span>
        <Popover open={toOpen} onOpenChange={setToOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className="flex items-center justify-between w-[110px] md:w-[130px] h-7 md:h-8 py-0 md:py-1 text-xs"
              size="sm"
            >
              <CalendarIcon className="mr-1 h-3 w-3 md:h-3.5 md:w-3.5" />
              <span className="text-xs truncate">{formatDate(toDate)}</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={toDate}
              onSelect={handleToDateChange}
              initialFocus
              locale={ko}
            />
          </PopoverContent>
        </Popover>
      </div>

      <Popover open={periodOpen} onOpenChange={setPeriodOpen}>
        <PopoverTrigger asChild>
          <Button 
            variant="outline" 
            size="sm"
            className="flex items-center ml-1 h-7 md:h-8 py-0 md:py-1 text-xs"
          >
            <span className="text-xs">{t('dateFilter.quickSelect')}</span> 
            <ChevronDown className="ml-1 h-3 w-3 md:h-3.5 md:w-3.5" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[200px] p-0">
          <div className="p-2 grid gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="justify-start font-normal text-xs h-8"
              onClick={() => handlePeriodSelect("today")}
            >
              {t('dateFilter.today')}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="justify-start font-normal text-xs h-8"
              onClick={() => handlePeriodSelect("thisWeek")}
            >
              {t('dateFilter.thisWeek')}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="justify-start font-normal text-xs h-8"
              onClick={() => handlePeriodSelect("thisMonth")}
            >
              {t('dateFilter.thisMonth')}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="justify-start font-normal text-xs h-8"
              onClick={() => handlePeriodSelect("lastMonth")}
            >
              {t('dateFilter.lastMonth')}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="justify-start font-normal text-xs h-8"
              onClick={() => handlePeriodSelect("last3Months")}
            >
              {t('dateFilter.last3Months')}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="justify-start font-normal text-xs h-8"
              onClick={() => handlePeriodSelect("thisYear")}
            >
              {t('dateFilter.thisYear')}
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
} 