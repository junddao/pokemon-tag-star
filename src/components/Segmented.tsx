'use client';

/** 도감의 탄·정렬 칩과 보스 화면의 탄 칩이 같은 물건이므로 한 곳에 둔다. */
export default function Segmented<T extends string | number>({
  options, value, onChange, small,
}: {
  options: { key: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
  small?: boolean;
}) {
  return (
    <div className="inline-flex shrink-0 rounded-xl border border-white/10 bg-white/[0.03] p-0.5">
      {options.map((o) => (
        <button
          key={String(o.key)}
          type="button"
          onClick={() => onChange(o.key)}
          className={`rounded-[10px] font-semibold transition ${small ? 'px-2.5 py-1 text-[11px]' : 'px-3 py-1.5 text-xs'} ${
            value === o.key ? 'bg-violet-400/25 text-white' : 'text-violet-200/55 hover:text-violet-100'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
