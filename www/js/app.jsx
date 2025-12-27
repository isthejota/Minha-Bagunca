console.log('app.jsx loading');

// Create safe placeholders for createRoot/render which may come from a UMD ReactDOM
let createRootFn = null;
let renderFn = null;

// make hooks available in outer scope — they were previously declared inside the try block
let useState, useEffect, useMemo, useRef;
// make Recharts components available in outer scope too
let AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer;

try {
    ({ useState, useEffect, useMemo, useRef } = React || {});
    // don't destructure from ReactDOM directly — it may be undefined in some environments
    const maybeReactDOM = (typeof ReactDOM !== 'undefined') ? ReactDOM : (typeof window !== 'undefined' ? window.ReactDOM : undefined);
    console.log('React, ReactDOM, Recharts:', typeof React, typeof maybeReactDOM, typeof Recharts);

    if (maybeReactDOM) {
        if (typeof maybeReactDOM.createRoot === 'function') createRootFn = maybeReactDOM.createRoot.bind(maybeReactDOM);
        if (typeof maybeReactDOM.render === 'function') renderFn = (el, container) => maybeReactDOM.render(el, container);
    }

    // Provide safe fallbacks if Recharts failed to load (prevents white screen)
    const RechartsAvailable = typeof Recharts !== 'undefined' && Recharts;
    const debugInfo = `R:${typeof React !== 'undefined'}, RD:${typeof ReactDOM !== 'undefined'}, PT:${typeof PropTypes !== 'undefined'}, RC:${typeof Recharts !== 'undefined'}`;

    AreaChart = RechartsAvailable ? Recharts.AreaChart : ({ children }) => React.createElement('div', { className: 'h-full flex flex-col items-center justify-center text-stone-400 text-xs' },
        React.createElement('span', null, 'Gráfico indisponível'),
        React.createElement('span', { className: 'text-[8px] opacity-50' }, debugInfo)
    );
    Area = RechartsAvailable ? Recharts.Area : () => null;
    XAxis = RechartsAvailable ? Recharts.XAxis : () => null;
    YAxis = RechartsAvailable ? Recharts.YAxis : () => null;
    CartesianGrid = RechartsAvailable ? Recharts.CartesianGrid : () => null;
    Tooltip = RechartsAvailable ? Recharts.Tooltip : () => null;
    ResponsiveContainer = RechartsAvailable ? Recharts.ResponsiveContainer : ({ children }) => React.createElement('div', { style: { width: '100%', height: '100%' } }, children);

    // rest of file continues below inside try block
} catch (e) {
    console.error('Error initializing libraries in app.jsx', e);
    throw e;
}

// --- Mock Inicial ---
const DEFAULT_TASKS = [
    { id: '1', title: 'Brainstorm Criativo', desc: 'Ideias para o novo app', time: '09:00', done: false, cat: 'Trabalho' },
    { id: '2', title: 'Reunião Mensal', desc: 'Alinhamento de metas', time: '11:00', done: true, cat: 'Trabalho' },
    { id: '3', title: 'Yoga Express', desc: '15 min de estica e puxa', time: '08:00', done: true, cat: 'Pessoal' },
    { id: '4', title: 'Comprar Tintas', desc: 'Azul e Amarelo para o quadro', time: '15:30', done: false, cat: 'Pessoal' },
    { id: '5', title: 'Limpar Mesa', desc: 'Organizar a bagunça real', time: '18:00', done: false, cat: 'Casa' }
];

const CHART_DATA = [
    { day: 'SEG', val: 4 }, { day: 'TER', val: 6 }, { day: 'QUA', val: 3 },
    { day: 'QUI', val: 7 }, { day: 'SEX', val: 2 }, { day: 'SÁB', val: 8 }, { day: 'DOM', val: 5 }
];

const CATEGORIES = {
    'Trabalho': { color: 'brand', icon: 'work' },
    'Pessoal': { color: 'purple', icon: 'person' },
    'Casa': { color: 'green', icon: 'home' },
    'Urgente': { color: 'red', icon: 'priority_high' }
};

const PRIVACY_POLICY = `Política de Privacidade\n\nEste aplicativo armazena localmente no seu dispositivo os dados de tarefas, perfil e configurações. As imagens de perfil selecionadas são guardadas localmente como data URLs. Não enviamos seus dados para servidores externos.\n\nVocê pode limpar seus dados a qualquer momento removendo tarefas ou limpando os dados do aplicativo nas configurações do dispositivo.\n\nContato: suporte@seudominio.com`;

const TERMS_OF_USE = `Termos de Uso\n\nAo utilizar este aplicativo, você concorda em usar as funcionalidades apenas para fins pessoais e não comerciais. O aplicativo é fornecido no estado em que se encontra, sem garantias expressas ou implícitas. Não nos responsabilizamos por perdas de dados; faça backups regularmente.\n\nVersão: 1.0`;

const Dashboard = ({ tasks, darkMode }) => {
    const todayStr = new Date().toISOString().split('T')[0];
    const todaysTasks = tasks.filter(t => t.date === todayStr || (!t.date && !t.recurring));
    const completed = todaysTasks.filter(t => t.done).length;
    const progress = todaysTasks.length > 0 ? Math.round((completed / todaysTasks.length) * 100) : 0;

    const weeklyData = useMemo(() => {
        const labels = ['SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB', 'DOM'];
        const data = labels.map(day => ({ day, val: 0 }));

        const now = new Date();
        const currentDay = now.getDay(); // 0 (Dom) to 6 (Sab)
        const diff = now.getDate() - currentDay + (currentDay === 0 ? -6 : 1);
        const monday = new Date(now.setDate(diff));

        tasks.forEach(task => {
            if (!task.date) return;
            const taskDate = new Date(task.date + 'T00:00:00');
            const weekDiff = Math.floor((taskDate - monday) / (1000 * 60 * 60 * 24));

            if (weekDiff >= 0 && weekDiff < 7) {
                data[weekDiff].val++;
            }
        });

        return data;
    }, [tasks]);

    return (
        <div className="space-y-6 animate-content">
            <div className="bg-white dark:bg-zinc-900 rounded-[2.5rem] p-8 shadow-sm border border-stone-100 dark:border-zinc-800 relative rotate-1 overflow-hidden">
                <div className="tape"></div>
                <div className="flex flex-col items-center text-center relative z-20">
                    <div className="size-16 rounded-full flex items-center justify-center mb-4 shadow-lg shadow-brand/20" style={{ background: 'var(--primary-gradient)' }}>
                        <span className="material-symbols-outlined text-4xl text-white filled">emoji_events</span>
                    </div>
                    <h2 className="text-2xl font-black text-stone-800 dark:text-zinc-100 tracking-tight leading-tight">Sua bagunça está<br />sob controle!</h2>
                    <p className="text-xs text-stone-400 dark:text-zinc-500 font-bold uppercase tracking-widest mt-2">Você concluiu {completed} tarefas hoje</p>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="bg-white dark:bg-zinc-900 p-6 rounded-[2.5rem] border border-stone-100 dark:border-zinc-800 flex flex-col items-center justify-center -rotate-1">
                    <div className="relative size-28 flex items-center justify-center">
                        <svg className="size-full -rotate-90">
                            <circle cx="56" cy="56" r="48" stroke="currentColor" className="text-stone-100 dark:text-zinc-800" strokeWidth="10" fill="transparent" />
                            <circle cx="56" cy="56" r="48" stroke="var(--primary)" strokeWidth="10" fill="transparent"
                                strokeDasharray="301.5" strokeDashoffset={301.5 - (301.5 * progress / 100)} strokeLinecap="round"
                                style={{ transition: 'stroke-dashoffset 1s ease-in-out' }} />
                        </svg>
                        <span className="absolute text-2xl font-black text-stone-800 dark:text-zinc-100">{progress}%</span>
                    </div>
                    <p className="mt-3 text-[10px] font-black text-stone-400 dark:text-zinc-500 uppercase tracking-widest">Meta Diária</p>
                </div>
                <div className="bg-white dark:bg-zinc-900 p-6 rounded-[2.5rem] border border-stone-100 dark:border-zinc-800 flex flex-col items-center justify-center rotate-1">
                    <span className="text-5xl font-black text-stone-800 dark:text-zinc-100">{todaysTasks.length}</span>
                    <p className="text-[10px] font-black text-stone-400 dark:text-zinc-500 uppercase tracking-widest mt-1">Total de Itens</p>
                    <div className="mt-3 px-3 py-1 bg-stone-50 dark:bg-zinc-800 rounded-full">
                        <span className="text-[10px] font-bold text-stone-500 dark:text-zinc-400 uppercase tracking-tight">Organizado</span>
                    </div>
                </div>
            </div>

            <div className="bg-white dark:bg-zinc-900 p-6 rounded-[2.5rem] border border-stone-100 dark:border-zinc-800 h-64">
                <header className="flex justify-between items-center mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800 dark:text-zinc-100">Meus Planejamentos</h1>
                    </div>
                    <button className="text-sm font-black text-stone-800 dark:text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                        <span className="material-symbols-outlined text-brand text-xl filled">trending_up</span>
                        Fluxo Semanal
                    </button>
                </header>
                <ResponsiveContainer width="100%" height="70%">
                    <AreaChart data={weeklyData}>
                        <defs>
                            <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.2} />
                                <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--grid-color)" />
                        <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: 'var(--muted-color)', fontSize: 10, fontWeight: 'bold' }} />
                        <YAxis hide />
                        <Tooltip
                            cursor={{ stroke: 'var(--primary)', strokeWidth: 2 }}
                            contentStyle={{
                                borderRadius: '1.5rem',
                                border: 'none',
                                backgroundColor: darkMode ? '#18181b' : '#ffffff',
                                color: darkMode ? '#f4f4f5' : '#111827',
                                boxShadow: '0 10px 25px var(--primary-shadow)',
                                fontWeight: 'bold'
                            }}
                            itemStyle={{ color: 'var(--primary)' }}
                        />
                        <Area type="monotone" dataKey="val" stroke="var(--primary)" strokeWidth={4} fill="url(#colorVal)" />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

const CalendarView = ({ tasks, goals, onAddClick, onDeleteGoal, onToggleTask, onDeleteTask, darkMode }) => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [viewMode, setViewMode] = useState('Mês');

    const daysInMonth = (month, year) => new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = (month, year) => {
        const day = new Date(year, month, 1).getDay();
        return (day + 6) % 7; // Ajusta para Segunda ser o primeiro dia (0=Seg, ..., 6=Dom)
    };

    const month = currentDate.getMonth();
    const year = currentDate.getFullYear();
    const monthNames = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

    const handlePrev = () => {
        const d = new Date(currentDate);
        if (viewMode === 'Dia') d.setDate(d.getDate() - 1);
        else if (viewMode === 'Semana') d.setDate(d.getDate() - 7);
        else d.setMonth(d.getMonth() - 1);
        setCurrentDate(d);
    };

    const handleNext = () => {
        const d = new Date(currentDate);
        if (viewMode === 'Dia') d.setDate(d.getDate() + 1);
        else if (viewMode === 'Semana') d.setDate(d.getDate() + 7);
        else d.setMonth(d.getMonth() + 1);
        setCurrentDate(d);
    };

    const days = Array.from({ length: daysInMonth(month, year) }, (_, i) => i + 1);
    const blanks = Array.from({ length: firstDayOfMonth(month, year) }, (_, i) => i);
    const today = new Date();
    const isToday = (d) => d === today.getDate() && month === today.getMonth() && year === today.getFullYear();

    const getTasksForDay = (d) => {
        const dateStr = typeof d === 'number'
            ? `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
            : d;
        return tasks.filter(t => t.date === dateStr);
    };

    return (
        <div className="space-y-6 animate-content pb-10">
            {/* Cabecalho do Calendario */}
            <div className="bg-white dark:bg-zinc-900 rounded-[2.5rem] p-6 shadow-sm border border-stone-100 dark:border-zinc-800 transition-all duration-500">
                <div className="flex justify-between items-center mb-6">
                    <button onClick={handlePrev} className="size-8 flex items-center justify-center text-stone-600">
                        <span className="material-symbols-outlined">chevron_left</span>
                    </button>
                    <div className="text-center">
                        <h3 className="font-black text-stone-800 dark:text-zinc-100 text-lg tracking-tighter uppercase leading-none">
                            {viewMode === 'Dia' ? currentDate.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' }) : `${monthNames[month]} ${year}`}
                        </h3>
                        {viewMode === 'Dia' && <p className="text-[10px] font-black text-brand uppercase tracking-widest mt-1">{currentDate.toLocaleDateString('pt-BR', { weekday: 'long' })}</p>}
                    </div>
                    <button onClick={handleNext} className="size-8 flex items-center justify-center text-stone-600">
                        <span className="material-symbols-outlined">chevron_right</span>
                    </button>
                </div>

                <div className="flex p-1 bg-stone-50 dark:bg-zinc-800/50 rounded-2xl mb-6">
                    {['Realizar', 'Mês', 'Semana', 'Dia'].map(mode => (
                        <button
                            key={mode}
                            onClick={() => setViewMode(mode)}
                            className={`flex-1 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${viewMode === mode ? 'bg-brand text-white shadow-lg' : 'text-stone-500 hover:text-stone-800'}`}
                        >
                            {mode}
                        </button>
                    ))}
                </div>

                {viewMode === 'Mês' && (
                    <>
                        {/* Grid Dias da Semana */}
                        <div className="grid grid-cols-7 border-b border-stone-100 dark:border-zinc-800 mb-2">
                            {['SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB', 'DOM'].map((d, i) => (
                                <div key={d} className={`py-2 text-[9px] font-black ${i === 6 ? 'text-red-500' : 'text-stone-500'} text-center`}>{d}</div>
                            ))}
                        </div>

                        {/* Grid do Mes */}
                        <div className="grid grid-cols-7 border-l border-t border-stone-50 dark:border-zinc-800/50">
                            {blanks.map(b => <div key={`b-${b}`} className="aspect-square border-r border-b border-stone-50 dark:border-zinc-800/50 bg-stone-50/30 dark:bg-zinc-900/40"></div>)}
                            {days.map(day => {
                                const dayTasks = getTasksForDay(day);
                                const todayMarker = isToday(day);
                                return (
                                    <div key={day} className="aspect-square border-r border-b border-stone-50 dark:border-zinc-800/50 relative p-1 group">
                                        <span className={`text-[10px] font-bold ${todayMarker ? 'bg-brand text-white size-5 flex items-center justify-center rounded-lg rotate-6' : 'text-stone-600 dark:text-zinc-400'}`}>
                                            {day}
                                        </span>
                                        <div className="mt-1 space-y-0.5 overflow-hidden">
                                            {dayTasks.slice(0, 2).map((t, tid) => (
                                                <div key={tid} className={`h-1.5 rounded-full ${CATEGORIES[t.cat]?.color === 'red' ? 'bg-red-500' : 'bg-brand/40'}`}></div>
                                            ))}
                                            {dayTasks.length > 2 && <div className="text-[7px] font-black text-stone-500 text-center">+{dayTasks.length - 2}</div>}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </>
                )}

                {viewMode === 'Semana' && (
                    <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 no-scrollbar">
                        {(() => {
                            const monday = new Date(currentDate);
                            const day = monday.getDay();
                            const diff = monday.getDate() - day + (day === 0 ? -6 : 1);
                            monday.setDate(diff);

                            return Array.from({ length: 7 }).map((_, i) => {
                                const d = new Date(monday);
                                d.setDate(monday.getDate() + i);
                                const dStr = d.toISOString().split('T')[0];
                                const dayTasks = tasks.filter(t => t.date === dStr);
                                const dayNames = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
                                const isDToday = d.toDateString() === new Date().toDateString();

                                return (
                                    <div key={i} className={`p-4 rounded-3xl border border-stone-100 dark:border-zinc-800 ${isDToday ? 'bg-brand-light dark:bg-brand-shadow ring-2 ring-brand/20' : 'bg-stone-50/50 dark:bg-zinc-800/30'}`}>
                                        <div className="flex justify-between items-center mb-3">
                                            <div className="flex items-center gap-2">
                                                <span className={`text-[10px] font-black uppercase tracking-widest ${isDToday ? 'text-brand' : 'text-stone-400'}`}>{dayNames[i]}</span>
                                                <span className="text-sm font-black text-stone-800 dark:text-zinc-100">{d.getDate()}</span>
                                            </div>
                                            <span className="text-[10px] font-bold text-stone-400">{dayTasks.length} {dayTasks.length === 1 ? 'tarefa' : 'tarefas'}</span>
                                        </div>
                                        <div className="space-y-2">
                                            {dayTasks.length === 0 ? (
                                                <p className="text-[10px] text-stone-300 dark:text-zinc-600 font-bold italic">Nenhuma atividade programada</p>
                                            ) : (
                                                dayTasks.map((t, tid) => (
                                                    <div key={tid} className="flex items-center gap-2 bg-white dark:bg-zinc-900 p-2 rounded-xl shadow-sm border border-stone-50 dark:border-zinc-800/50">
                                                        <div className={`size-1.5 rounded-full ${CATEGORIES[t.cat]?.color === 'red' ? 'bg-red-500' : 'bg-brand'}`}></div>
                                                        <span className={`text-xs font-bold truncate flex-1 ${t.done ? 'line-through opacity-40' : 'text-stone-700 dark:text-zinc-300'}`}>{t.title}</span>
                                                        <span className="text-[8px] font-black opacity-30 uppercase">{t.time}</span>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                );
                            });
                        })()}
                    </div>
                )}

                {viewMode === 'Dia' && (
                    <div className="space-y-6 max-h-[500px] overflow-y-auto pr-2 no-scrollbar py-4">
                        {(() => {
                            const dStr = currentDate.toISOString().split('T')[0];
                            const dayTasks = tasks.filter(t => t.date === dStr).sort((a, b) => (a.time || '00:00').localeCompare(b.time || '00:00'));

                            if (dayTasks.length === 0) return (
                                <div className="py-12 text-center opacity-40">
                                    <p className="text-xs font-black uppercase tracking-widest text-stone-400">Dia livre!<br />Sem tarefas agendadas.</p>
                                </div>
                            );

                            return dayTasks.map((t, tid) => (
                                <div key={tid} className="flex gap-4 group">
                                    <div className="w-12 text-right pt-1">
                                        <span className="text-[10px] font-black text-stone-400 dark:text-zinc-500">{t.time}</span>
                                    </div>
                                    <div className="flex-1 relative pb-6">
                                        {/* Linha vertical decorativa */}
                                        {tid !== dayTasks.length - 1 && <div className="absolute left-[3px] top-6 bottom-0 w-[2px] bg-stone-100 dark:bg-zinc-800"></div>}
                                        <div className="absolute left-0 top-[7px] size-2 rounded-full bg-brand shadow-[0_0_8px_var(--primary-shadow)]"></div>

                                        <div className="ml-6 bg-stone-50 dark:bg-zinc-800/40 p-5 rounded-[2rem] border border-stone-100 dark:border-zinc-800 group-hover:scale-[1.02] transition-all duration-300">
                                            <div className="flex justify-between items-start mb-1">
                                                <h4 className={`text-sm font-black ${t.done ? 'line-through opacity-40' : 'text-stone-800 dark:text-zinc-100'}`}>{t.title}</h4>
                                                <span className={`text-[8px] px-2 py-0.5 rounded-full font-black uppercase tracking-tighter ${CATEGORIES[t.cat]?.color === 'red' ? 'bg-red-50 text-red-500' : 'bg-brand-light text-brand'}`}>
                                                    {t.cat}
                                                </span>
                                            </div>
                                            {t.desc && <p className="text-[10px] text-stone-500 dark:text-zinc-400 font-medium leading-relaxed mt-1">{t.desc}</p>}
                                        </div>
                                    </div>
                                </div>
                            ));
                        })()}
                    </div>
                )}

                {viewMode === 'Realizar' && (
                    <div className="space-y-6 max-h-[500px] overflow-y-auto pr-2 no-scrollbar py-4 px-1">
                        {(() => {
                            const monthTasks = tasks.filter(t => {
                                const [y, m] = t.date.split('-');
                                return parseInt(y) === year && parseInt(m) === month + 1 && !t.done;
                            }).sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time));

                            if (monthTasks.length === 0) return (
                                <div className="py-20 text-center flex flex-col items-center justify-center gap-4">
                                    <div className="size-20 rounded-full bg-stone-50 dark:bg-zinc-800 flex items-center justify-center text-brand">
                                        <span className="material-symbols-outlined text-5xl filled">check_circle</span>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-sm font-black text-stone-800 dark:text-zinc-100 uppercase tracking-tighter">Tudo em dia!</p>
                                        <p className="text-[10px] font-bold text-stone-400 dark:text-zinc-500 uppercase tracking-widest">Nenhuma pendência para este mês</p>
                                    </div>
                                </div>
                            );

                            return (
                                <>
                                    <div className="flex items-center justify-between mb-2">
                                        <h4 className="text-[10px] font-black text-stone-400 dark:text-zinc-600 uppercase tracking-widest">Foco de Execução</h4>
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] font-black text-stone-400 uppercase">{monthTasks.length} restam</span>
                                            <div className="h-1 w-8 bg-stone-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                                                <div className="h-full bg-brand animate-pulse" style={{ width: '40%' }}></div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        {monthTasks.map((t, tid) => (
                                            <div key={t.id} className="flex items-center gap-4 bg-stone-50 dark:bg-zinc-800/40 p-4 rounded-3xl border border-stone-100 dark:border-zinc-800 group hover:border-brand/30 transition-all active:scale-[0.98]">
                                                <button
                                                    onClick={() => onToggleTask(t.id)}
                                                    className={`size-7 rounded-xl border-2 flex items-center justify-center transition-all ${t.done ? 'bg-brand border-brand rotate-12' : 'border-stone-200 dark:border-zinc-700 hover:border-brand'}`}
                                                >
                                                    {t.done && <span className="material-symbols-outlined text-white text-sm font-black">check</span>}
                                                </button>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 mb-0.5">
                                                        <span className="text-[9px] font-black text-brand uppercase tracking-tighter">
                                                            {new Date(t.date + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                                                        </span>
                                                        <span className="text-[8px] text-stone-300 dark:text-zinc-700">•</span>
                                                        <span className="text-[9px] font-bold text-stone-400 dark:text-zinc-500">{t.time}</span>
                                                    </div>
                                                    <h5 className="text-sm font-black text-stone-700 dark:text-zinc-300 truncate">{t.title}</h5>
                                                </div>
                                                <span className={`text-[8px] px-2 py-1 rounded-full font-black uppercase tracking-tighter ${CATEGORIES[t.cat]?.color === 'red' ? 'bg-red-50 text-red-500' : 'bg-brand/10 text-brand'}`}>
                                                    {t.cat}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </>
                            );
                        })()}
                    </div>
                )}
            </div>

            {/* Metas Mensais */}
            <div className="bg-white dark:bg-zinc-900 rounded-[2.5rem] p-8 shadow-sm border border-stone-100 dark:border-zinc-800 relative overflow-hidden">
                <div className="tape"></div>
                <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-stone-500 mb-6">Metas Mensais</h4>
                <div className="space-y-4">
                    {goals.length === 0 ? (
                        <div className="text-center py-6 opacity-40">
                            <p className="text-[10px] font-black uppercase tracking-widest text-stone-400">Nenhuma meta ainda</p>
                        </div>
                    ) : (
                        goals.map((g, idx) => (
                            <div key={idx} className="flex items-center gap-4 bg-stone-50 dark:bg-zinc-800/50 p-5 rounded-[2rem] border border-stone-100 dark:border-zinc-800 group relative">
                                <div className="size-10 rounded-2xl bg-brand text-white flex items-center justify-center shadow-lg shadow-brand/20">
                                    <span className="material-symbols-outlined text-xl">emoji_events</span>
                                </div>
                                <div className="flex-1">
                                    <p className="text-xs font-black text-stone-800 dark:text-zinc-100">{g.title}</p>
                                    <div className="w-full bg-stone-200 dark:bg-zinc-700 h-1.5 rounded-full mt-2 overflow-hidden">
                                        <div className="bg-brand h-full rounded-full shadow-sm" style={{ width: `${g.progress}%`, boxShadow: '0 0 10px var(--primary-shadow)' }}></div>
                                    </div>
                                </div>
                                <button
                                    onClick={() => onDeleteGoal(idx)}
                                    className="size-8 rounded-full bg-red-100 text-red-500 hidden group-hover:flex items-center justify-center active:scale-95 transition-all"
                                >
                                    <span className="material-symbols-outlined text-sm font-black">delete</span>
                                </button>
                            </div>
                        ))
                    )}
                    <button
                        onClick={onAddClick}
                        className="w-full py-5 border-4 border-dashed border-stone-50 dark:border-zinc-800/50 rounded-[2rem] flex items-center justify-center gap-3 group active:scale-95 transition-all"
                    >
                        <div className="size-8 bg-stone-50 dark:bg-zinc-800 rounded-xl flex items-center justify-center group-hover:bg-brand/10 transition-colors">
                            <span className="material-symbols-outlined text-stone-500 group-hover:text-brand font-black">add</span>
                        </div>
                        <span className="text-xs font-black text-stone-500 group-hover:text-brand transition-colors">Adicionar Metas</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

const DailyList = ({ tasks, onToggle, onDelete, darkMode }) => {
    const todayStr = new Date().toISOString().split('T')[0];
    const todaysTasks = tasks.filter(t => (t.date === todayStr || !t.date));

    return (
        <div className="space-y-4 animate-content pb-10">
            <div className="mb-8 flex justify-between items-end">
                <div>
                    <h1 className="text-4xl font-black text-stone-800 tracking-tighter">Hoje</h1>
                    <p className="text-stone-400 text-xs font-bold uppercase tracking-[0.2em] mt-1">Bagunça Planejada</p>
                </div>
                <div className="text-right">
                    <p className="text-2xl font-black text-brand leading-none">{todaysTasks.filter(t => t.done).length}/{todaysTasks.length}</p>
                    <p className="text-[10px] font-bold text-stone-300 dark:text-zinc-600 uppercase">Feito</p>
                </div>
            </div>

            <div className="relative pl-4 space-y-6">
                <div className="absolute left-[1.15rem] top-2 bottom-2 w-0.5 bg-stone-100 dark:bg-zinc-800 rounded-full"></div>
                {todaysTasks.length === 0 ? (
                    <div className="text-center py-20 flex flex-col items-center">
                        <div className="size-20 bg-stone-50 rounded-full flex items-center justify-center text-stone-200 mb-4 rotate-12">
                            <span className="material-symbols-outlined text-5xl">draw</span>
                        </div>
                        <p className="text-stone-400 font-bold">Nenhuma bagunça agendada!</p>
                        <p className="text-[10px] text-stone-200 uppercase font-black tracking-widest mt-1">Adicione algo no botão +</p>
                    </div>
                ) : (
                    todaysTasks.sort((a, b) => a.time.localeCompare(b.time)).map((task, idx) => {
                        const config = CATEGORIES[task.cat] || CATEGORIES['Trabalho'];
                        return (
                            <div key={task.id} className="flex gap-6 items-start group">
                                <div className="z-10 bg-[#f8f7f6] dark:bg-[#09090b] py-1">
                                    <div className={`size-3.5 rounded-full border-2 transition-all duration-500 ${task.done ? 'bg-brand border-brand scale-125' : 'bg-white dark:bg-zinc-900 border-stone-200 dark:border-zinc-700'}`}></div>
                                </div>
                                <div
                                    className={`flex-1 p-5 bg-white rounded-[2rem] border cursor-pointer paper-card shadow-sm ${idx % 2 === 0 ? 'rotate-1' : '-rotate-1'} ${task.done ? 'opacity-40 grayscale border-transparent' : 'border-stone-100 dark:border-zinc-800'}`}
                                    onClick={() => onToggle(task.id)}
                                >
                                    <div className="flex justify-between items-start">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className="text-[10px] font-black text-stone-800 dark:text-zinc-300 bg-stone-100 dark:bg-zinc-800 px-2 py-0.5 rounded-full uppercase tracking-tighter">{task.time}</span>
                                                <span className={`text-[9px] px-2 py-0.5 rounded-full font-black uppercase tracking-tight ${config.color === 'brand' ? 'text-brand dark:text-brand bg-brand-light dark:bg-brand-shadow' : `text-${config.color}-500 bg-${config.color}-50 dark:bg-${config.color}-900/20`}`}>
                                                    {task.cat}
                                                </span>
                                            </div>
                                            <h4 className={`text-base font-black leading-tight ${task.done ? 'line-through decoration-brand/50' : 'text-stone-800'}`}>{task.title}</h4>
                                            {task.desc && <p className="text-xs text-stone-400 mt-2 font-medium">{task.desc}</p>}
                                        </div>
                                        <div className="flex flex-col items-end gap-2">
                                            <div className={`size-7 rounded-xl border-2 flex items-center justify-center transition-all ${task.done ? 'bg-brand border-brand rotate-12' : 'border-stone-100 rotate-0'}`}>
                                                {task.done && <span className="material-symbols-outlined text-white text-base font-black">check</span>}
                                            </div>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); onDelete(task.id); }}
                                                className="size-9 flex items-center justify-center bg-red-500 text-white rounded-2xl active:scale-75 transition-all shadow-lg shadow-red-200"
                                            >
                                                <span className="material-symbols-outlined text-xl font-black">delete</span>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
};

const App = () => {
    // Version Control
    const APP_VERSION = '1.0.0'; // Must match config.xml version
    const VERSION_CONTROL_URL = 'https://raw.githubusercontent.com/isthejota/Minha-Bagunca/main/version-control.json';

    const [tasks, setTasks] = useState(() => {
        const saved = localStorage.getItem('minha-bagunca-tasks');
        return saved ? JSON.parse(saved) : DEFAULT_TASKS;
    });
    const [view, setView] = useState('daily');
    const [showAdd, setShowAdd] = useState(false);
    const [showAddGoal, setShowAddGoal] = useState(false);
    const [newTask, setNewTask] = useState({ title: '', desc: '', time: '09:00', cat: 'Trabalho', date: new Date().toISOString().split('T')[0] });
    const [newGoal, setNewGoal] = useState({ title: '', progress: 0 });
    const [updateRequired, setUpdateRequired] = useState(false);
    const [updateInfo, setUpdateInfo] = useState(null);

    const [monthlyGoals, setMonthlyGoals] = useState(() => {
        const saved = localStorage.getItem('minha-bagunca-goals');
        return saved ? JSON.parse(saved) : [];
    });

    // profile: name + photo (data URL or remote URL)
    const [profile, setProfile] = useState(() => {
        const saved = localStorage.getItem('minha-bagunca-profile');
        return saved ? JSON.parse(saved) : { name: 'Mente Criativa', photo: 'https://picsum.photos/seed/artist/200' };
    });

    // reminders on/off
    const [remindersEnabled, setRemindersEnabled] = useState(() => {
        const s = localStorage.getItem('minha-bagunca-reminders');
        return s ? JSON.parse(s) : true;
    });

    // alarm sound object { uri, name, channelId }
    const [alarmSound, setAlarmSound] = useState(() => {
        const saved = localStorage.getItem('minha-bagunca-alarm-sound');
        if (!saved) return null;
        try {
            return JSON.parse(saved);
        } catch (e) {
            return { uri: saved, name: 'Música selecionada', channelId: 'alarm_channel_default' };
        }
    });

    const reminderTimeoutsRef = useRef([]);

    // persist profile and reminders setting
    useEffect(() => { localStorage.setItem('minha-bagunca-profile', JSON.stringify(profile)); }, [profile]);
    useEffect(() => { localStorage.setItem('minha-bagunca-reminders', JSON.stringify(remindersEnabled)); }, [remindersEnabled]);
    useEffect(() => { if (alarmSound) localStorage.setItem('minha-bagunca-alarm-sound', JSON.stringify(alarmSound)); }, [alarmSound]);
    useEffect(() => { localStorage.setItem('minha-bagunca-goals', JSON.stringify(monthlyGoals)); }, [monthlyGoals]);
    // dark mode
    const [darkMode, setDarkMode] = useState(() => {
        const s = localStorage.getItem('minha-bagunca-dark');
        return s ? JSON.parse(s) : false;
    });
    useEffect(() => {
        localStorage.setItem('minha-bagunca-dark', JSON.stringify(darkMode));
        try {
            if (darkMode) document.documentElement.classList.add('dark'); else document.documentElement.classList.remove('dark');
        } catch (e) { }
    }, [darkMode]);
    // document modal for Policies/Terms
    const [docModal, setDocModal] = useState({ show: false, title: '', content: '' });

    // theme color
    const [themeColor, setThemeColor] = useState(() => {
        return localStorage.getItem('minha-bagunca-theme') || '#ee9d2b';
    });

    useEffect(() => {
        localStorage.setItem('minha-bagunca-theme', themeColor);

        const r = parseInt(themeColor.slice(1, 3), 16);
        const g = parseInt(themeColor.slice(3, 5), 16);
        const b = parseInt(themeColor.slice(5, 7), 16);

        const adjust = (c, amt) => Math.max(0, Math.min(255, c + amt));
        const lR = adjust(r, 20), lG = adjust(g, 20), lB = adjust(b, 20);

        // Advanced tinting for immersive atmosphere
        const tintR = adjust(r, 240), tintG = adjust(g, 240), tintB = adjust(b, 240);
        const paperBg = darkMode ? '#09090b' : `rgb(${tintR}, ${tintG}, ${tintB})`;
        const gridOp = darkMode ? 0.04 : 0.08;
        const gridColor = `rgba(${r}, ${g}, ${b}, ${gridOp})`;

        document.documentElement.style.setProperty('--primary', themeColor);
        document.documentElement.style.setProperty('--primary-light', `rgba(${r}, ${g}, ${b}, 0.05)`);
        document.documentElement.style.setProperty('--primary-shadow', `rgba(${r}, ${g}, ${b}, 0.15)`);
        document.documentElement.style.setProperty('--primary-gradient', `linear-gradient(135deg, ${themeColor}, rgb(${lR}, ${lG}, ${lB}))`);
        document.documentElement.style.setProperty('--bg-paper', paperBg);
        document.documentElement.style.setProperty('--grid-color', gridColor);
        document.documentElement.style.setProperty('--border-weak', `rgba(${r}, ${g}, ${b}, 0.1)`);
    }, [themeColor, darkMode]);

    // Version Check
    const compareVersions = (v1, v2) => {
        const parts1 = v1.split('.').map(Number);
        const parts2 = v2.split('.').map(Number);
        for (let i = 0; i < 3; i++) {
            if (parts1[i] > parts2[i]) return 1;
            if (parts1[i] < parts2[i]) return -1;
        }
        return 0;
    };

    const checkAppVersion = async () => {
        try {
            const response = await fetch(VERSION_CONTROL_URL, { cache: 'no-cache' });
            if (!response.ok) return; // Fail silently if can't reach server
            const data = await response.json();

            // Check if current version is below minimum required
            if (compareVersions(APP_VERSION, data.minVersion) < 0) {
                setUpdateInfo(data);
                setUpdateRequired(true);
            }
        } catch (e) {
            console.warn('Could not check app version:', e);
            // Fail silently - don't block app if version check fails
        }
    };

    useEffect(() => {
        checkAppVersion();
    }, []);
    const openDoc = (title, content) => setDocModal({ show: true, title, content });

    useEffect(() => {
        localStorage.setItem('minha-bagunca-tasks', JSON.stringify(tasks));
    }, [tasks]);

    // helper to show notification (uses Web Notifications API when available)
    const [alertModal, setAlertModal] = useState({ show: false, title: '', body: '' });

    const handleAddGoal = () => {
        if (!newGoal.title.trim()) return;
        setMonthlyGoals([...monthlyGoals, { ...newGoal, id: Date.now() }]);
        setNewGoal({ title: '', progress: 0 });
        setShowAddGoal(false);
    };

    const handleDeleteGoal = (index) => {
        const updated = [...monthlyGoals];
        updated.splice(index, 1);
        setMonthlyGoals(updated);
    };

    const showNotification = (task) => {
        const title = task.title || 'Lembrete';
        const body = task.desc ? `${task.desc} — ${task.time}` : `Hora: ${task.time}`;
        console.log('showNotification called:', { title, body });

        // Play alarm sound if app is open
        if (alarmSound) {
            testAlarmSound();
        }

        // Try Cordova local notification plugin (Native)
        let nativeStatus = 'Não verificado';
        if (typeof window !== 'undefined' && window.cordova && window.cordova.plugins && window.cordova.plugins.notification && window.cordova.plugins.notification.local) {
            try {
                const local = window.cordova.plugins.notification.local;
                const nid = task.id ? (parseInt(String(task.id).replace(/[^\d]/g, '')) || Math.floor(Math.random() * 1000000)) : Math.floor(Math.random() * 1000000);

                console.log('Scheduling native notification:', nid);
                local.schedule({
                    id: nid,
                    title: title,
                    text: body,
                    foreground: true,
                    priority: 2,
                    wakeup: true,
                    vibrate: true,
                    sound: alarmSound?.uri || undefined,
                    channel: alarmSound?.channelId || 'reminders',
                    data: { taskId: task.id || null }
                });
                nativeStatus = 'Agendada via Plugin';
            } catch (e) {
                console.warn('Native notification failed:', e);
                nativeStatus = 'Erro no Plugin: ' + e.message;
            }
        } else {
            console.log('Native notification plugin NOT available');
            nativeStatus = 'Plugin não encontrado (Cordova)';
        }

        // Show the in-app modal (Always for internal confirmation)
        setAlertModal({ show: true, title, body });
    };

    // schedule reminders for tasks (simple in-memory scheduling while the app is running)
    const scheduleReminders = () => {
        // clear existing timers
        (reminderTimeoutsRef.current || []).forEach(id => clearTimeout(id));
        reminderTimeoutsRef.current = [];

        if (!remindersEnabled) return;

        const now = new Date();

        // If Cordova local notification plugin is available, cancel existing scheduled and use plugin
        const hasPlugin = typeof window !== 'undefined' && window.cordova && window.cordova.plugins && window.cordova.plugins.notification && window.cordova.plugins.notification.local;
        try {
            if (hasPlugin) {
                const local = window.cordova.plugins.notification.local;
                if (typeof local.cancelAll === 'function') {
                    try { local.cancelAll(); } catch (e) { /* ignore */ }
                }

                tasks.forEach(task => {
                    if (task.done || !task.time) return;
                    const [hh, mm] = (task.time || '00:00').split(':').map(n => parseInt(n, 10));
                    const target = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hh || 0, mm || 0, 0, 0);
                    if (target.getTime() <= now.getTime()) return;

                    const nid = parseInt(String(task.id).replace(/[^\d]/g, '')) || Math.floor(Math.random() * 1000000);

                    const notif = {
                        id: nid,
                        title: `Lembrete: ${task.title}`,
                        text: task.desc ? `${task.desc} — ${task.time}` : `Hora: ${task.time}`,
                        foreground: true,
                        priority: 2,
                        vibrate: true,
                        wakeup: true,
                        launch: true,
                        lockscreen: true,
                        channel: alarmSound?.channelId || 'reminders',
                        smallIcon: 'res://icon',
                        sound: alarmSound?.uri || undefined,
                        data: { taskId: task.id }
                    };

                    // Try modern 'trigger' API, fall back to older 'at' param
                    try {
                        local.schedule({ ...notif, trigger: { at: target } });
                    } catch (e1) {
                        try { local.schedule({ ...notif, at: target }); } catch (e2) { /* final fallback below */ }
                    }
                });
                return;
            }
        } catch (e) {
            console.warn('Local notification plugin scheduling failed, falling back to in-memory timers', e);
        }

        // Fallback: in-memory timers using Notification API or alert (works only while app is open)
        tasks.forEach(task => {
            if (task.done) return; // skip completed
            if (!task.time) return;
            const [hh, mm] = (task.time || '00:00').split(':').map(n => parseInt(n, 10));
            const target = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hh || 0, mm || 0, 0, 0);
            if (target.getTime() <= now.getTime()) return;
            const delay = target.getTime() - now.getTime();
            const id = setTimeout(() => showNotification(task), delay);
            reminderTimeoutsRef.current.push(id);
        });
    };

    // reschedule whenever tasks or reminders setting change
    useEffect(() => {
        scheduleReminders();
        return () => { (reminderTimeoutsRef.current || []).forEach(id => clearTimeout(id)); reminderTimeoutsRef.current = []; };
    }, [tasks, remindersEnabled, profile]);

    // Unified Device & Permission Initialization
    useEffect(() => {
        const init = async () => {
            const onReady = async () => {
                console.log('Device Ready - Initializing...');
                const permissions = window.cordova && window.cordova.plugins && window.cordova.plugins.permissions;

                if (permissions) {
                    const list = [
                        permissions.WRITE_EXTERNAL_STORAGE,
                        permissions.READ_EXTERNAL_STORAGE,
                        permissions.POST_NOTIFICATIONS
                    ];

                    // Check if we already have ALL permissions
                    const checkPermissions = () => new Promise((res) => {
                        let missing = [];
                        let checked = 0;
                        list.forEach(p => {
                            permissions.hasPermission(p, (status) => {
                                if (!status || !status.hasPermission) missing.push(p);
                                checked++;
                                if (checked === list.length) res(missing);
                            }, () => {
                                missing.push(p);
                                checked++;
                                if (checked === list.length) res(missing);
                            });
                        });
                    });

                    const missingBlocks = await checkPermissions();
                    if (missingBlocks.length > 0) {
                        console.log('Missing permissions:', missingBlocks);
                        permissions.requestPermissions(missingBlocks, (status) => {
                            if (status && status.hasPermission) console.log('Permissions granted');
                            else console.warn('Some permissions denied');
                            scheduleReminders(); // Always try to schedule
                        });
                    } else {
                        console.log('All permissions already granted');
                        scheduleReminders();
                    }
                } else {
                    scheduleReminders();
                }
            };

            if (window.cordova) {
                document.addEventListener('deviceready', onReady, false);
                // Listen for notification triggers
                if (window.cordova.plugins && window.cordova.plugins.notification && window.cordova.plugins.notification.local) {
                    window.cordova.plugins.notification.local.on('trigger', (notification) => {
                        console.log('Notification triggered:', notification);
                        if (alarmSound && alarmSound.uri) {
                            if (typeof Media !== 'undefined') {
                                const m = new Media(alarmSound.uri, () => m.release(), (err) => console.error('Media error:', err));
                                m.play();
                            }
                        }
                    });
                }
            } else {
                // Browser fallback
                setTimeout(scheduleReminders, 1000);
            }
        };
        init();
    }, [tasks, remindersEnabled]); // Reschedule if settings change


    const toggleTask = (id) => {
        setTasks((prev) => prev.map(t => t.id === id ? { ...t, done: !t.done } : t));
    };

    const deleteTask = (id) => {
        setTasks((prev) => prev.filter(t => t.id !== id));
    };

    const handleAddTask = () => {
        if (!newTask.title) return;
        const task = { ...newTask, id: Math.random().toString(36).substr(2, 9), done: false };
        setTasks([...tasks, task]);
        setShowAdd(false);
        setNewTask({ title: '', desc: '', time: '09:00', cat: 'Trabalho', date: new Date().toISOString().split('T')[0] });
    };


    const handleProfileFile = (e) => {
        const f = e.target.files && e.target.files[0];
        if (!f) return;
        const reader = new FileReader();
        reader.onload = () => setProfile(prev => ({ ...prev, photo: reader.result }));
        reader.readAsDataURL(f);
    };

    const saveLocalSound = (sourceUri, fileName) => {
        return new Promise((resolve, reject) => {
            if (!window.resolveLocalFileSystemURL) {
                resolve(sourceUri); // Fallback to original
                return;
            }

            console.log('Copying file to local storage...', sourceUri);
            window.resolveLocalFileSystemURL(sourceUri, (fileEntry) => {
                window.resolveLocalFileSystemURL(cordova.file.dataDirectory, (dirEntry) => {
                    const newName = `custom_alarm_${Date.now()}_${fileName.replace(/[^a-z0-9.]/gi, '_')}`;
                    fileEntry.copyTo(dirEntry, newName, (copiedEntry) => {
                        console.log('File copied to:', copiedEntry.nativeURL);
                        resolve(copiedEntry.nativeURL);
                    }, reject);
                }, reject);
            }, (err) => {
                // If the source URI cannot be resolved directly (common with content://), 
                // we might need to use xhr to get the blob and save it if chooser didn't provide it.
                // But cordova-plugin-chooser usually provides a reachable URI.
                resolve(sourceUri);
            });
        });
    };

    const handlePickAlarmSound = () => {
        if (typeof window !== 'undefined' && window.chooser) {
            window.chooser.getFile('audio/*')
                .then(async (file) => {
                    if (file) {
                        try {
                            const localUri = await saveLocalSound(file.uri, file.name);
                            const newChannelId = `alarm_ch_${Date.now()}`;
                            console.log('Selected alarm sound:', file.name, localUri, newChannelId);
                            setAlarmSound({ uri: localUri, name: file.name, channelId: newChannelId });
                        } catch (e) {
                            console.error('Copy failed, using original URI:', e);
                            setAlarmSound({ uri: file.uri, name: file.name, channelId: `alarm_ch_${Date.now()}` });
                        }
                    }
                })
                .catch((err) => {
                    console.error('Error picking file:', err);
                    setAlertModal({ show: true, title: 'Erro', body: 'Não foi possível selecionar o arquivo.' });
                });
        } else {
            console.warn('Chooser plugin not available');
            setAlertModal({ show: true, title: 'Erro', body: 'Recurso de seleção de arquivos não disponível no seu dispositivo.' });
        }
    };

    const testAlarmSound = () => {
        if (!alarmSound || !alarmSound.uri) {
            setAlertModal({ show: true, title: 'Aviso', body: 'Nenhuma música selecionada.' });
            return;
        }
        if (typeof Media !== 'undefined') {
            const m = new Media(alarmSound.uri, () => m.release(), (err) => console.error('Media error:', err));
            m.play();
            // stop after 10 seconds for testing
            setTimeout(() => m.stop(), 10000);
        } else {
            const audio = new Audio(alarmSound.uri);
            audio.play();
            setTimeout(() => audio.pause(), 10000);
        }
    };


    return (
        <div className="app-root w-full min-h-screen flex flex-col paper-bg shadow-2xl relative transition-colors duration-500" style={{ backgroundColor: 'var(--bg-paper)' }}>

            <header className="flex items-center justify-between px-6 pt-10 pb-6 sticky top-0 backdrop-blur-2xl z-40 transition-all duration-500" style={{ backgroundColor: 'var(--bg-paper)', opacity: 0.96 }}>
                <div className="absolute inset-x-0 top-0 h-1" style={{ background: 'var(--primary-gradient)' }}></div>
                <button
                    onClick={() => setView('dashboard')}
                    className={`size-11 flex items-center justify-center rounded-2xl transition-all shadow-sm border ${view === 'dashboard' ? 'bg-brand dark:bg-zinc-100 border-brand dark:border-zinc-100 text-white dark:text-zinc-900 rotate-6' : 'bg-white dark:bg-zinc-900 border-stone-100 dark:border-zinc-800 text-stone-400 dark:text-zinc-500'}`}
                >
                    <span className="material-symbols-outlined">grid_view</span>
                </button>
                <div className="flex flex-col items-center">
                    <span className="text-xl font-black text-stone-800 dark:text-zinc-100 tracking-tighter uppercase italic">Minha Bagunça</span>
                    <div className="h-1.5 w-10 bg-brand rounded-full mt-1 -rotate-2"></div>
                </div>
                <button
                    onClick={() => setView('settings')}
                    className={`size-11 rounded-2xl overflow-hidden border-2 transition-all ${view === 'settings' ? 'border-brand scale-110 -rotate-6' : 'border-white dark:border-zinc-800'}`}
                >
                    <img src={profile.photo} className="size-full object-cover" alt="Perfil" />
                </button>
            </header>

            <main className="flex-1 px-6 pt-6 pb-32 overflow-y-auto no-scrollbar">
                {view === 'dashboard' && <Dashboard tasks={tasks} darkMode={darkMode} />}
                {view === 'daily' && <DailyList tasks={tasks} onToggle={toggleTask} onDelete={deleteTask} darkMode={darkMode} />}
                {view === 'calendar' && (
                    <CalendarView
                        tasks={tasks}
                        goals={monthlyGoals}
                        onAddClick={() => setShowAddGoal(true)}
                        onDeleteGoal={handleDeleteGoal}
                        onToggleTask={toggleTask}
                        onDeleteTask={deleteTask}
                        darkMode={darkMode}
                    />
                )}
                {view === 'settings' && (
                    <div className="space-y-6 animate-content">
                        <div className="bg-white dark:bg-zinc-900 p-8 rounded-[3rem] border border-stone-100 dark:border-zinc-800 flex flex-col items-center gap-4 text-center">
                            <div className="size-24 rounded-[2rem] overflow-hidden rotate-6 shadow-xl border-4 border-white dark:border-zinc-800">
                                <img src={profile.photo} className="size-full object-cover" alt="avatar" />
                            </div>
                            <div className="w-full">
                                <input
                                    type="text"
                                    value={profile.name}
                                    onChange={e => setProfile(prev => ({ ...prev, name: e.target.value }))}
                                    className="w-full text-2xl font-black bg-white dark:bg-zinc-800 rounded-[2rem] border-none shadow-sm p-4 text-center dark:text-zinc-100"
                                />
                                <p className="text-xs text-stone-400 font-bold uppercase tracking-widest mt-2 text-center">Plano Bagunça Premium</p>
                                <div className="mt-4 flex gap-3 justify-center">
                                    <input id="profile-file" type="file" accept="image/*" onChange={handleProfileFile} style={{ display: 'none' }} />
                                    <button onClick={() => document.getElementById('profile-file').click()} className="py-2 px-4 bg-stone-100 rounded-full text-sm font-bold">Mudar foto</button>
                                    <button onClick={() => { localStorage.removeItem('minha-bagunca-profile'); setProfile({ name: 'Mente Criativa', photo: 'https://picsum.photos/seed/artist/200' }); }} className="py-2 px-4 bg-stone-50 rounded-full text-sm font-bold">Restaurar</button>
                                </div>
                            </div>
                        </div>
                        <div className="bg-white dark:bg-zinc-900 rounded-[3rem] border border-stone-100 dark:border-zinc-800 overflow-hidden divide-y divide-stone-50 dark:divide-zinc-800">
                            <div className="p-6 flex flex-col gap-4 hover:bg-stone-50 dark:hover:bg-zinc-800/50 transition-colors">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="size-10 rounded-2xl bg-brand-light dark:bg-brand-shadow text-brand flex items-center justify-center">
                                            <span className="material-symbols-outlined filled">notifications</span>
                                        </div>
                                        <span className="text-sm font-black text-stone-700 dark:text-zinc-300">Lembretes</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <label className="switch small">
                                            <input type="checkbox" checked={remindersEnabled} onChange={e => setRemindersEnabled(e.target.checked)} />
                                            <span className="slider"></span>
                                        </label>
                                        <span className="switch-label">{remindersEnabled ? 'Ativado' : 'Desativado'}</span>
                                        <button onClick={() => showNotification({ title: 'Teste', desc: 'Notificação de teste', time: new Date().toLocaleTimeString() })} className="btn-ghost">Testar Notif.</button>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between pl-14">
                                    <div className="flex-1 pr-4">
                                        <p className="text-[9px] font-black text-stone-300 dark:text-zinc-600 uppercase tracking-widest mb-1">Arquivo Selecionado</p>
                                        <p className="text-xs font-black text-stone-600 dark:text-zinc-400 truncate max-w-[140px]">
                                            {alarmSound ? alarmSound.name : 'Padrão do sistema'}
                                        </p>
                                    </div>
                                    <div className="flex gap-2">
                                        <button onClick={handlePickAlarmSound} className="py-2.5 px-4 bg-stone-100 dark:bg-zinc-800 rounded-2xl text-[10px] font-black uppercase tracking-tight text-stone-600 dark:text-zinc-400 active:scale-95 transition-all">Escolher</button>
                                        {alarmSound && <button onClick={testAlarmSound} className="py-2.5 px-4 bg-brand-light dark:bg-brand-shadow rounded-2xl text-[10px] font-black uppercase tracking-tight text-brand active:scale-95 transition-all">Ouvir</button>}
                                    </div>
                                </div>
                            </div>

                            <div className="p-6 flex flex-col gap-4 hover:bg-stone-50 dark:hover:bg-zinc-800/50 transition-colors">
                                <div className="flex items-center gap-4">
                                    <div className="size-10 rounded-2xl bg-stone-50 dark:bg-zinc-800 text-stone-400 dark:text-zinc-500 flex items-center justify-center">
                                        <span className="material-symbols-outlined filled">palette</span>
                                    </div>
                                    <span className="text-sm font-black text-stone-700 dark:text-zinc-300">Cor do App</span>
                                </div>
                                <div className="flex gap-4 pl-14 overflow-x-auto py-1 hide-scrollbar">
                                    {[
                                        { name: 'Laranja', color: '#ee9d2b' },
                                        { name: 'Azul', color: '#3b82f6' },
                                        { name: 'Roxo', color: '#8b5cf6' },
                                        { name: 'Verde', color: '#10b981' },
                                        { name: 'Rosa', color: '#f43f5e' }
                                    ].map(c => (
                                        <button
                                            key={c.color}
                                            onClick={() => setThemeColor(c.color)}
                                            className={`size-10 rounded-full flex-shrink-0 transition-all ${themeColor === c.color ? 'scale-125 ring-4 ring-white dark:ring-zinc-800 shadow-xl' : 'scale-90 hover:scale-110 shadow-sm'}`}
                                            style={{ backgroundColor: c.color }}
                                            aria-label={c.name}
                                        />
                                    ))}
                                </div>
                            </div>
                            <div className="p-6 flex items-center justify-between hover:bg-stone-50 dark:hover:bg-zinc-800/50 transition-colors">
                                <div className="flex items-center gap-4">
                                    <div className="size-10 rounded-2xl bg-stone-50 dark:bg-zinc-800 text-stone-400 dark:text-zinc-500 flex items-center justify-center">
                                        <span className="material-symbols-outlined filled">dark_mode</span>
                                    </div>
                                    <span className="text-sm font-black text-stone-700 dark:text-zinc-300">Modo Noturno Premium</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <label className="switch small">
                                        <input type="checkbox" checked={darkMode} onChange={e => setDarkMode(e.target.checked)} />
                                        <span className="slider"></span>
                                    </label>
                                    <span className="switch-label dark:text-zinc-400">{darkMode ? 'Ativado' : 'Desativado'}</span>
                                </div>
                            </div>
                            <div className="p-6 flex items-center justify-between hover:bg-stone-50 dark:hover:bg-zinc-800/50 transition-colors">
                                <div className="flex items-center gap-4">
                                    <div className="size-10 rounded-2xl bg-stone-50 dark:bg-zinc-800 text-stone-400 dark:text-zinc-500 flex items-center justify-center">
                                        <span className="material-symbols-outlined filled">info</span>
                                    </div>
                                    <span className="text-sm font-black text-stone-700 dark:text-zinc-300">Versão do App</span>
                                </div>
                                <div className="text-sm text-stone-400 dark:text-zinc-500 font-bold">1.0.1</div>
                            </div>
                            <div className="p-6 flex items-center justify-between hover:bg-stone-50 dark:hover:bg-zinc-800/50 transition-colors cursor-pointer" onClick={() => openDoc('Política de Privacidade', PRIVACY_POLICY)}>
                                <div className="flex items-center gap-4">
                                    <div className="size-10 rounded-2xl bg-stone-50 dark:bg-zinc-800 text-stone-400 dark:text-zinc-500 flex items-center justify-center">
                                        <span className="material-symbols-outlined filled">policy</span>
                                    </div>
                                    <span className="text-sm font-black text-stone-700 dark:text-zinc-300">Política de Privacidade</span>
                                </div>
                                <div className="text-sm text-stone-400 dark:text-zinc-500">Abrir</div>
                            </div>

                            <div className="p-6 flex items-center justify-between hover:bg-stone-50 dark:hover:bg-zinc-800/50 transition-colors cursor-pointer" onClick={() => openDoc('Termos de Uso', TERMS_OF_USE)}>
                                <div className="flex items-center gap-4">
                                    <div className="size-10 rounded-2xl bg-stone-50 dark:bg-zinc-800 text-stone-400 dark:text-zinc-500 flex items-center justify-center">
                                        <span className="material-symbols-outlined filled">description</span>
                                    </div>
                                    <span className="text-sm font-black text-stone-700 dark:text-zinc-300">Termos de Uso</span>
                                </div>
                                <div className="text-sm text-stone-400 dark:text-zinc-500">Abrir</div>
                            </div>
                        </div>
                    </div>
                )}
            </main>

            <nav className="fixed bottom-0 left-0 right-0 w-full h-24 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-2xl border-t border-stone-50 dark:border-zinc-800 shadow-[0_-20px_50px_rgba(0,0,0,0.04)] z-40 px-6 md:px-10 flex items-center justify-around transition-colors duration-500">
                {[
                    { id: 'dashboard', icon: 'auto_graph' },
                    { id: 'daily', icon: 'format_list_bulleted' },
                    { id: 'calendar', icon: 'calendar_today' },
                    { id: 'settings', icon: 'settings' }
                ].map(tab => (
                    <button key={tab.id} onClick={() => setView(tab.id)} className={`transition-all duration-300 ${view === tab.id ? 'tab-active' : 'tab-inactive'}`}>
                        <span className={`material-symbols-outlined text-3xl ${view === tab.id ? 'filled' : ''}`}>{tab.icon}</span>
                    </button>
                ))}
            </nav>

            <button
                onClick={() => setShowAdd(true)}
                className="fixed bottom-28 right-8 size-16 bg-brand text-white rounded-[2rem] shadow-2xl flex items-center justify-center hover:scale-110 active:scale-90 transition-all rotate-12 border-4 border-white dark:border-zinc-800 z-50 group"
                style={{ boxShadow: '0 15px 45px var(--primary-shadow)' }}
            >
                <span className="material-symbols-outlined text-4xl font-black group-hover:rotate-90 transition-transform duration-500">add</span>
            </button>

            {showAdd && (
                <div className="fixed inset-0 bg-stone-200/40 dark:bg-black/80 backdrop-blur-sm z-[100] flex flex-col justify-end" onClick={() => setShowAdd(false)}>
                    <div className="bg-white dark:bg-zinc-900 modal-card rounded-t-[4rem] p-10 animate-content shadow-2xl" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-10">
                            <h3 className="text-3xl font-black text-stone-800 dark:text-zinc-100 tracking-tighter">Nova Bagunça</h3>
                            <button onClick={() => setShowAdd(false)} className="size-10 rounded-full bg-stone-100 flex items-center justify-center text-stone-600 active:scale-90 transition-all border-none">
                                <span className="material-symbols-outlined font-black">close</span>
                            </button>
                        </div>
                        <div className="space-y-8">
                            <div className="space-y-2">
                                <p className="text-[11px] font-black text-stone-300 uppercase tracking-widest ml-1">O que vamos bagunçar?</p>
                                <input
                                    type="text"
                                    placeholder="Ex: Pintar o mundo"
                                    value={newTask.title}
                                    onChange={e => setNewTask({ ...newTask, title: e.target.value })}
                                    className="w-full text-2xl font-black bg-white dark:bg-zinc-800 rounded-[2rem] border-none shadow-sm focus:ring-4 focus:ring-brand-light dark:focus:ring-brand-light/20 p-6 placeholder:text-stone-300 dark:placeholder:text-zinc-600 dark:text-zinc-100"
                                    autoFocus
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <p className="text-[11px] font-black text-stone-300 uppercase tracking-widest ml-1">Data</p>
                                    <input
                                        type="date"
                                        value={newTask.date}
                                        onChange={e => setNewTask({ ...newTask, date: e.target.value })}
                                        className="w-full font-black bg-white dark:bg-zinc-800 rounded-[2rem] border-none shadow-sm p-6 focus:ring-4 focus:ring-brand-light dark:text-zinc-100"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <p className="text-[11px] font-black text-stone-300 uppercase tracking-widest ml-1">Horário</p>
                                    <input
                                        type="time"
                                        value={newTask.time}
                                        onChange={e => setNewTask({ ...newTask, time: e.target.value })}
                                        className="w-full font-black bg-white dark:bg-zinc-800 rounded-[2rem] border-none shadow-sm p-6 focus:ring-4 focus:ring-brand-light dark:text-zinc-100"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <p className="text-[11px] font-black text-stone-300 uppercase tracking-widest ml-1">Categoria</p>
                                    <select
                                        value={newTask.cat}
                                        onChange={e => setNewTask({ ...newTask, cat: e.target.value })}
                                        className="w-full font-black bg-white dark:bg-zinc-800 rounded-[2rem] border-none shadow-sm p-6 focus:ring-4 focus:ring-brand-light dark:focus:ring-brand-light/20 appearance-none dark:text-zinc-100"
                                    >
                                        {Object.keys(CATEGORIES).map(c => <option key={c}>{c}</option>)}
                                    </select>
                                </div>
                            </div>
                            <button
                                onClick={handleAddTask}
                                className="w-full py-6 bg-brand text-white rounded-[2.5rem] font-black text-xl shadow-2xl active:scale-95 transition-all mt-4 hover:brightness-90"
                                style={{ boxShadow: '0 20px 40px var(--primary-shadow)' }}
                            >
                                Confirmar Bagunça
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {showAddGoal && (
                <div className="fixed inset-0 bg-stone-200/40 dark:bg-black/80 backdrop-blur-sm z-[100] flex flex-col justify-end" onClick={() => setShowAddGoal(false)}>
                    <div className="bg-white dark:bg-zinc-900 modal-card rounded-t-[4rem] p-10 animate-content shadow-2xl" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-10">
                            <h3 className="text-3xl font-black text-stone-800 dark:text-zinc-100 tracking-tighter">Nova Meta</h3>
                            <button onClick={() => setShowAddGoal(false)} className="size-10 rounded-full bg-stone-100 dark:bg-zinc-800 flex items-center justify-center text-stone-600 dark:text-zinc-300 active:scale-90 transition-all border-none">
                                <span className="material-symbols-outlined font-black">close</span>
                            </button>
                        </div>
                        <div className="space-y-8">
                            <div className="space-y-2">
                                <p className="text-[11px] font-black text-stone-300 uppercase tracking-widest ml-1">O que quer conquistar?</p>
                                <input
                                    type="text"
                                    placeholder="Ex: Ler 3 livros"
                                    value={newGoal.title}
                                    onChange={e => setNewGoal({ ...newGoal, title: e.target.value })}
                                    className="w-full text-2xl font-black bg-white dark:bg-zinc-800 rounded-[2rem] border-none shadow-sm focus:ring-4 focus:ring-brand-light dark:focus:ring-brand-light/20 p-6 placeholder:text-stone-300 dark:placeholder:text-zinc-600 dark:text-zinc-100"
                                    autoFocus
                                />
                            </div>
                            <div className="space-y-4">
                                <p className="text-[11px] font-black text-stone-300 uppercase tracking-widest ml-1">Progresso Inicial: {newGoal.progress}%</p>
                                <input
                                    type="range"
                                    min="0"
                                    max="100"
                                    value={newGoal.progress}
                                    onChange={e => setNewGoal({ ...newGoal, progress: parseInt(e.target.value) })}
                                    className="w-full accent-brand h-2 bg-stone-100 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer"
                                />
                            </div>
                            <button onClick={handleAddGoal} className="w-full py-6 bg-brand text-white text-xl font-black rounded-3xl shadow-xl shadow-brand/20 active:scale-95 transition-all">Definir Meta</button>
                        </div>
                    </div>
                </div>
            )}
            {/* In-app alert modal (fallback) */}
            {alertModal.show && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center">
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setAlertModal({ show: false, title: '', body: '' })}></div>
                    <div className="relative w-[92%] max-w-lg bg-white dark:bg-[#0f1724] modal-card rounded-2xl shadow-2xl p-6 mx-4">
                        <h3 className="text-lg font-black text-stone-800 dark:text-white mb-2">{alertModal.title}</h3>
                        <p className="text-sm text-stone-500 dark:text-stone-300 mb-6">{alertModal.body}</p>
                        <div className="flex justify-end">
                            <button onClick={() => setAlertModal({ show: false, title: '', body: '' })} className="btn-primary">OK</button>
                        </div>
                    </div>
                </div>
            )}
            {/* Document modal for Privacy / Terms */}
            {docModal.show && (
                <div className="fixed inset-0 z-[115] flex items-center justify-center">
                    <div className="absolute inset-0 bg-black/50" onClick={() => setDocModal({ show: false, title: '', content: '' })}></div>
                    <div className="relative w-[94%] max-w-2xl bg-white dark:bg-[#071025] modal-card rounded-2xl shadow-2xl p-0 mx-4 max-h-[86vh] overflow-hidden">
                        <div className="p-6 border-b border-stone-100 dark:border-stone-800 flex items-start justify-between gap-4">
                            <div>
                                <h3 className="text-lg font-black text-stone-800 dark:text-white mb-1">{docModal.title}</h3>
                                <p className="text-xs text-stone-400 dark:text-stone-300">Última atualização: {new Date().toLocaleDateString()}</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <button onClick={() => setDocModal({ show: false, title: '', content: '' })} className="size-8 rounded-full bg-stone-100 flex items-center justify-center text-stone-400">
                                    <span className="material-symbols-outlined text-sm">close</span>
                                </button>
                            </div>
                        </div>
                        <div className="p-6 overflow-auto max-h-[68vh]">
                            <article className="prose prose-sm max-w-none text-stone-700 dark:text-stone-200 leading-relaxed">
                                {String(docModal.content || '').split('\n\n').map((par, i) => (
                                    <div key={i} className="doc-paragraph"><p className="m-0">{par}</p></div>
                                ))}
                            </article>
                        </div>
                        <div className="p-4 border-t border-stone-100 dark:border-stone-800 flex justify-end bg-stone-50 dark:bg-transparent">
                            <button onClick={() => setDocModal({ show: false, title: '', content: '' })} className="py-2 px-6 btn-primary">Fechar</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Update Required Modal - Cannot be dismissed */}
            {updateRequired && updateInfo && (
                <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[200] flex items-center justify-center p-6">
                    <div className="bg-white dark:bg-zinc-900 rounded-[3rem] p-10 max-w-md w-full shadow-2xl border-4 border-brand animate-content">
                        <div className="text-center space-y-6">
                            <div className="size-24 mx-auto rounded-full bg-brand/10 flex items-center justify-center">
                                <span className="material-symbols-outlined text-6xl text-brand filled">system_update</span>
                            </div>
                            <div className="space-y-2">
                                <h2 className="text-2xl font-black text-stone-800 dark:text-zinc-100 tracking-tight">Atualização Necessária</h2>
                                <p className="text-sm text-stone-600 dark:text-zinc-400 leading-relaxed">
                                    {updateInfo.updateMessage}
                                </p>
                            </div>
                            <div className="bg-stone-50 dark:bg-zinc-800/50 rounded-2xl p-4 space-y-1">
                                <div className="flex justify-between items-center text-xs">
                                    <span className="font-bold text-stone-400 dark:text-zinc-500 uppercase tracking-widest">Versão Atual</span>
                                    <span className="font-black text-stone-600 dark:text-zinc-300">{APP_VERSION}</span>
                                </div>
                                <div className="flex justify-between items-center text-xs">
                                    <span className="font-bold text-stone-400 dark:text-zinc-500 uppercase tracking-widest">Nova Versão</span>
                                    <span className="font-black text-brand">{updateInfo.latestVersion}</span>
                                </div>
                            </div>
                            <button
                                onClick={() => window.open(updateInfo.downloadUrl, '_system')}
                                className="w-full py-5 bg-brand text-white rounded-[2rem] font-black text-lg shadow-2xl active:scale-95 transition-all"
                                style={{ boxShadow: '0 20px 40px var(--primary-shadow)' }}
                            >
                                Baixar Atualização
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div >
    );
};

try {
    const container = document.getElementById('root');
    if (!container) throw new Error('Root container not found');

    if (createRootFn) {
        const root = createRootFn(container);
        root.render(<App />);
    } else if (renderFn) {
        renderFn(<App />, container);
    } else if (typeof window !== 'undefined' && window.__appErrors !== undefined) {
        window.__appErrors.push('No ReactDOM.createRoot or ReactDOM.render available. Ensure React/ReactDOM are loaded.');
        throw new Error('No ReactDOM.createRoot or ReactDOM.render available.');
    } else {
        throw new Error('No ReactDOM.createRoot or ReactDOM.render available.');
    }

    console.log('App rendered');
} catch (e) {
    console.error('Render error', e);
    if (typeof window !== 'undefined' && window.__appErrors !== undefined) {
        try { window.__appErrors.push(String(e)); } catch (_) { }
    }
    throw e;
    throw e;
}
