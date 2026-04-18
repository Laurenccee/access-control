'use client';

import { SquareTerminal } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface AdminConsoleProps {
  initialLogs: any[];
}

export default function LiveTerminalLogs({ initialLogs }: AdminConsoleProps) {
  const getEventLabel = (event: string) => {
    if (event === 'SIGN_IN') return 'SIGN_IN';
    if (event === 'SIGN_OUT') return 'SIGN_OUT';
    if (event.startsWith('2-FACTOR')) return '2FA';
    if (event.startsWith('USER_CREATE')) return 'USER_CREATE';
    return event; // fallback: show raw value
  };

  const getEventColor = (event: string) => {
    if (event === 'SIGN_IN') return 'text-blue-600';
    if (event === 'SIGN_OUT') return 'text-slate-500';
    if (event.startsWith('2-FACTOR')) return 'text-violet-600';
    if (event.startsWith('USER_CREATE')) return 'text-emerald-600';
    return 'text-slate-600';
  };
  const getEventPayload = (event: string) => {
    const colonIndex = event.indexOf(':');
    return colonIndex !== -1 ? event.slice(colonIndex + 1).trim() : null;
  };

  console.log('Initial Logs:', initialLogs); // Debugging line to check the logs data

  return (
    <div className="flex gap-4">
      <div className="flex flex-col flex-1 gap-4">
        <Card className="border-border/80  flex-1"></Card>
        <Card className="border-border/80  flex-1"></Card>
      </div>
      <Card className="border-border/80 flex-1/2 overflow-hidden">
        <CardHeader className="bg-slate-50 border-b">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-0">
            <CardTitle className="text-xs uppercase flex items-center gap-2 text-slate-600">
              <SquareTerminal size={20} /> Live System Activity Console Log
            </CardTitle>
            <div className="flex gap-1 mt-2 sm:mt-0">
              <div className="w-2 h-2 rounded-full bg-slate-200" />
              <div className="w-2 h-2 rounded-full bg-slate-200" />
              <div className="w-2 h-2 rounded-full bg-slate-200" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-2 sm:px-4 md:px-8 ">
          <div className="flex flex-col gap-1">
            {initialLogs.map((log) => {
              const time = new Date(log.created_at).toLocaleTimeString([], {
                hour12: false,
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
              });
              const date = new Date(log.created_at).toLocaleDateString([], {
                day: '2-digit',
                month: '2-digit',
                year: '2-digit',
              });
              const status = log.status.toUpperCase(); // normalize here
              const isSuccess = status === 'SUCCESS';
              return (
                <div
                  key={log.id}
                  className="flex flex-wrap items-center gap-x-1 sm:gap-x-2 md:gap-x-3 px-1 py-2 md:py-1 uppercase font-mono tracking-widest text-[12px] md:text-[13px] leading-tight hover:bg-slate-100/60 transition-colors"
                >
                  <span className="text-slate-500">{'>'}</span>
                  <span className="text-slate-700 tabular-nums w-auto min-w-40 shrink-0">
                    [{time} :: {date}]
                  </span>
                  <span className="text-blue-700 shrink-0">[LOGS]</span>
                  <span className="text-slate-700">::</span>
                  <span
                    className={`w-auto min-w-10 shrink-0 tracking-wide ${getEventColor(log.event_type)}`}
                  >
                    [ACTION :: {getEventLabel(log.event_type)}]
                  </span>
                  <span className="text-slate-700">::</span>
                  <span className="w-auto min-w-15 shrink-0 text-indigo-700 truncate">
                    [BY :: {log.username || 'Unknown'}]
                  </span>
                  <span className="text-slate-700">::</span>
                  <span
                    className={`shrink-0 flex items-center gap-1 ${
                      isSuccess ? 'text-green-600' : 'text-rose-600'
                    }`}
                  >
                    {(() => {
                      const payload = getEventPayload(log.event_type);
                      return payload ? (
                        <>
                          <span
                            className={`${isSuccess ? 'text-cyan-600' : 'text-rose-600'}`}
                          >
                            [USER_CREATION: {payload} ]
                          </span>
                        </>
                      ) : null;
                    })()}
                    [STATUS :: {status}]
                  </span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
