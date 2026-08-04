'use client';

import {
  type ComponentProps,
  Fragment,
  type HTMLAttributes,
  type ReactElement,
  type ReactNode,
  type RefObject,
  useEffect,
  useRef,
  useState,
} from 'react';
import { cn } from '@/lib/cn';
import Image from 'next/image';
import MainImg from './main.png';
import OpenAPIImg from './openapi.png';
import NotebookImg from './notebook.png';
import { cva } from 'class-variance-authority';
import AgentHeroImage from './agent-hero.png';
import SecondSectionBg from './2nd-section-bg.png';
import Greek2Image from './assets/greek-2.webp';
import HeroLightImg from '@/public/hero.png';
import HeroDarkImg from '@/public/hero-dark.png';
import { useTheme } from 'next-themes';
import dynamic from 'next/dynamic';
import { ArrowRight } from 'lucide-react';

function createSafeShaderComponent(loader: () => Promise<any>) {
  const component = dynamic(
    async () => {
      try {
        const mod = await loader();
        return { default: mod.default ?? mod };
      } catch (error) {
        console.warn('Shader component failed to load, falling back to a no-op component.', error);
        return {
          default: ({ children, ...props }: ComponentProps<'div'> & { children?: ReactNode }) => (
            <div {...props}>{children ?? null}</div>
          ),
        };
      }
    },
    {
      ssr: false,
      loading: () => null,
    },
  );

  return component as unknown as React.ComponentType<any>;
}

const GrainGradient = createSafeShaderComponent(() =>
  import('@paper-design/shaders-react').then((mod) => mod.GrainGradient),
);
const ImageDithering = createSafeShaderComponent(() =>
  import('@paper-design/shaders-react').then((mod) => mod.ImageDithering),
);

export function Hero() {
  const { resolvedTheme } = useTheme();
  const ref = useRef<HTMLDivElement | null>(null);
  const visible = useIsVisible(ref);
  const [showShaders, setShowShaders] = useState(false);

  useEffect(() => {
    setTimeout(() => {
      setShowShaders(true);
    }, 400);
  }, []);

  return (
    <>
      {showShaders && (
        <GrainGradient
          className="absolute inset-0 animate-fd-fade-in duration-800"
          colors={
            resolvedTheme === 'dark'
              ? ['#173b12', '#3f6f2d', '#00000000']
              : ['#2d5724', '#77975b', '#00000000']
          }
          colorBack="#00000000"
          softness={1}
          intensity={0.38}
          noise={0.42}
          speed={visible ? 1 : 0}
          shape="corners"
          minPixelRatio={1}
          maxPixelCount={1920 * 1080}
        />
      )}
      {showShaders && (
        <ImageDithering
          image={AgentHeroImage.src}
          width={760}
          height={510}
          colorBack="#00000000"
          type="4x4"
          size={3}
          colorSteps={4}
          originalColors
          className="absolute right-[-40px] top-[-10px] animate-fd-fade-in duration-400 max-lg:right-[-180px] max-lg:opacity-45 max-md:hidden"
          minPixelRatio={1}
          maxPixelCount={960 * 640}
        />
      )}
      <div
        ref={ref}
        className={cn(
          'absolute top-[430px] left-[28%] w-[min(1040px,72vw)] rounded-2xl border border-fd-border/80 bg-fd-card/92 p-2 shadow-[0_30px_120px_rgba(15,80,25,0.35)] backdrop-blur-xl lg:top-[385px] max-md:hidden',
          showShaders ? 'animate-in fade-in slide-in-from-bottom-4 duration-500' : 'invisible',
        )}
      >
        <HeroArticlePreview />
      </div>
    </>
  );
}

function HeroArticlePreview() {
  return (
    <div className="relative overflow-hidden rounded-xl border border-fd-border/70 bg-fd-card">
      <Image
        src={HeroLightImg}
        alt="Cognitive dispatch preview"
        priority
        className="block dark:hidden w-full h-auto object-cover"
      />
      <Image
        src={HeroDarkImg}
        alt="Cognitive dispatch preview"
        priority
        className="hidden dark:block w-full h-auto object-cover"
      />
    </div>
  );
}

export function SecondSectionBackdrop() {
  const { resolvedTheme } = useTheme();
  const [showShader, setShowShader] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShowShader(true), 250);

    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      <div className="absolute inset-x-0 top-1/2 -z-3 aspect-[1782/1024] w-full -translate-y-1/2 overflow-hidden">
        <Image
          src={SecondSectionBg}
          alt=""
          fill
          className="object-contain opacity-70 saturate-60 dark:opacity-65"
        />
        {showShader && (
          <ImageDithering
            image={SecondSectionBg.src}
            width="100%"
            height="100%"
            fit="contain"
            scale={1}
            colorBack="#00000000"
            colorFront={resolvedTheme === 'dark' ? '#123b12' : '#173f13'}
            colorHighlight={resolvedTheme === 'dark' ? '#8fd56f' : '#7fcf58'}
            type="4x4"
            size={6}
            colorSteps={2}
            originalColors={false}
            className="absolute inset-0 opacity-95 mix-blend-screen dark:opacity-90"
            minPixelRatio={1}
            maxPixelCount={1280 * 720}
          />
        )}
      </div>
      <div className="absolute inset-0 -z-2 bg-[#020702]/55 mix-blend-multiply dark:bg-[#020502]/60" />
      <div className="absolute inset-0 -z-1 bg-radial-[circle_at_50%_0%] from-brand/24 via-transparent to-black/35" />
    </>
  );
}

export function CreateAppAnimation(props: ComponentProps<'div'>) {
  const installCmd = 'pnpm create fumadocs-app';
  const tickTime = 100;
  const timeCommandEnter = installCmd.length;
  const timeCommandRun = timeCommandEnter + 3;
  const timeCommandEnd = timeCommandRun + 3;
  const timeWindowOpen = timeCommandEnd + 1;
  const timeEnd = timeWindowOpen + 1;

  const [tick, setTick] = useState(timeEnd);

  useEffect(() => {
    const timer = setInterval(() => {
      setTick((prev) => (prev >= timeEnd ? prev : prev + 1));
    }, tickTime);

    return () => {
      clearInterval(timer);
    };
  }, [timeEnd]);

  const lines: ReactElement[] = [];

  lines.push(
    <span key="command_type">
      {installCmd.substring(0, tick)}
      {tick < timeCommandEnter && (
        <div className="inline-block h-3 w-1 animate-pulse bg-fd-foreground" />
      )}
    </span>,
  );

  if (tick >= timeCommandEnter) {
    lines.push(<span key="space"> </span>);
  }

  if (tick > timeCommandRun)
    lines.push(
      <Fragment key="command_response">
        {tick > timeCommandRun + 1 && (
          <>
            <span className="font-medium">◇ Project name</span>
            <span>│ my-app</span>
          </>
        )}
        {tick > timeCommandRun + 2 && (
          <>
            <span>│</span>
            <span className="font-medium">◆ Choose a framework</span>
          </>
        )}
        {tick > timeCommandRun + 3 && (
          <>
            <span>│ ● Next.js</span>
            <span>│ ○ Waku</span>
            <span>│ ○ Tanstack Start</span>
            <span>│ ○ React Router</span>
          </>
        )}
      </Fragment>,
    );

  return (
    <div
      {...props}
      onMouseEnter={() => {
        if (tick >= timeEnd) {
          setTick(0);
        }
      }}
    >
      {tick > timeWindowOpen && (
        <LaunchAppWindow className="absolute bottom-5 right-4 z-10 animate-in fade-in slide-in-from-top-10" />
      )}
      <pre className="font-mono text-sm min-h-[240px]">
        <code className="grid">{lines}</code>
      </pre>
    </div>
  );
}

function LaunchAppWindow(props: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      {...props}
      className={cn('overflow-hidden rounded-md border bg-fd-popover shadow-lg', props.className)}
    >
      <p className="text-xs text-fd-muted-foreground text-center px-4 py-2 border-b">
        localhost:3000
      </p>
      <p className="text-sm px-4 py-2">New App launched!</p>
    </div>
  );
}

const previewButtonVariants = cva('w-20 h-8 text-sm font-medium transition-colors rounded-full', {
  variants: {
    active: {
      true: 'text-fd-primary-foreground',
      false: 'text-fd-muted-foreground',
    },
  },
});
export function PreviewImages(props: ComponentProps<'div'>) {
  const [active, setActive] = useState(0);
  const previews = [
    {
      image: MainImg,
      name: 'Docs',
    },
    {
      image: NotebookImg,
      name: 'Notebook',
    },
    {
      image: OpenAPIImg,
      name: 'OpenAPI',
    },
  ];

  return (
    <div {...props} className={cn('relative grid', props.className)}>
      <div className="absolute flex flex-row left-1/2 -translate-1/2 bottom-0 z-2 p-0.5 rounded-full bg-fd-card border shadow-xl">
        <div
          role="none"
          className="absolute bg-fd-primary rounded-full w-20 h-8 transition-transform z-[-1]"
          style={{
            transform: `translateX(calc(var(--spacing) * 20 * ${active}))`,
          }}
        />
        {previews.map((item, i) => (
          <button
            key={i}
            className={cn(previewButtonVariants({ active: active === i }))}
            onClick={() => setActive(i)}
          >
            {item.name}
          </button>
        ))}
      </div>
      {previews.map((item, i) => (
        <Image
          key={i}
          src={item.image}
          alt="preview"
          className={cn(
            'col-start-1 row-start-1 select-none',
            active === i ? 'animate-in fade-in slide-in-from-bottom-12 duration-800' : 'invisible',
          )}
        />
      ))}
    </div>
  );
}

export function AgnosticBackground() {
  return (
    <div
      className="absolute inset-0 -z-1 mask-[linear-gradient(to_top,white_30%,transparent_calc(100%-120px))]"
      style={{
        backgroundImage:
          'radial-gradient(circle at 20% 70%, #39be1c66, transparent 28%), radial-gradient(circle at 80% 30%, #91ff3d33, transparent 34%), linear-gradient(135deg, transparent 0 45%, #39be1c22 45% 55%, transparent 55% 100%)',
      }}
    />
  );
}

let observer: IntersectionObserver;

const observerTargets = new WeakMap<Element, (entry: IntersectionObserverEntry) => void>();

function useIsVisible(ref: RefObject<HTMLElement | null>) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    observer ??= new IntersectionObserver((entries) => {
      for (const entry of entries) {
        observerTargets.get(entry.target)?.(entry);
      }
    });

    const element = ref.current;
    if (!element) return;

    observerTargets.set(element, (entry) => {
      setVisible(entry.isIntersecting);
    });

    observer.observe(element);

    return () => {
      observer.unobserve(element);
      observerTargets.delete(element);
    };
  }, [ref]);

  return visible;
}

export function ConceptFlowDiagram() {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setTick((t) => t + 1);
    }, 1200);
    return () => clearInterval(interval);
  }, []);

  const activeStep = Math.floor(tick / 3) % 3;
  const subStep = tick % 3;

  return (
    <div className="mt-auto flex flex-col gap-6 border-t bg-black p-8 text-emerald-50 relative overflow-hidden select-none">
      {/* Background grid pattern or glow */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />
      <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-64 h-64 bg-brand/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="relative flex flex-col gap-8">
        {/* Step 1 */}
        <div className="relative flex items-start gap-4 z-10">
          <span 
            className={cn(
              "grid size-9 shrink-0 place-items-center rounded-full border font-mono text-xs transition-all duration-500",
              activeStep === 0 
                ? "border-brand bg-brand/20 text-brand scale-110 shadow-[0_0_15px_rgba(34,197,94,0.3)]" 
                : "border-white/10 bg-white/5 text-emerald-50/40"
            )}
          >
            1
          </span>
          <div 
            className={cn(
              "min-w-0 flex-1 rounded-xl border p-4 transition-all duration-500 bg-white/5",
              activeStep === 0 
                ? "border-brand/40 bg-white/10 shadow-[0_0_20px_rgba(34,197,94,0.08)] translate-x-2" 
                : "border-white/10"
            )}
          >
            <p className={cn(
              "text-[10px] uppercase tracking-[0.24em] transition-colors duration-500",
              activeStep === 0 ? "text-brand" : "text-emerald-300/40"
            )}>
              new term
            </p>
            <div className="mt-1 flex items-center gap-2">
              <span className="text-sm font-semibold tracking-tight">Agentic Retrieval</span>
              {activeStep === 0 && (
                <span className="w-1.5 h-3.5 bg-brand animate-pulse" />
              )}
            </div>
          </div>
          {/* Connector Line */}
          <div className="absolute left-[17px] top-9 w-[2px] h-[36px] bg-white/5 pointer-events-none">
            <div 
              className={cn(
                "absolute w-full bg-brand shadow-[0_0_8px_var(--brand)] transition-all duration-1000 ease-in-out",
                activeStep === 0 ? "h-full top-0" : "h-0 top-full"
              )}
            />
          </div>
        </div>

        {/* Step 2 */}
        <div className="relative flex items-start gap-4 z-10">
          <span 
            className={cn(
              "grid size-9 shrink-0 place-items-center rounded-full border font-mono text-xs transition-all duration-500",
              activeStep === 1 
                ? "border-brand bg-brand/20 text-brand scale-110 shadow-[0_0_15px_rgba(34,197,94,0.3)]" 
                : "border-white/10 bg-white/5 text-emerald-50/40"
            )}
          >
            2
          </span>
          <div 
            className={cn(
              "min-w-0 flex-1 rounded-xl border p-4 transition-all duration-500 bg-white/5",
              activeStep === 1 
                ? "border-brand/40 bg-white/10 shadow-[0_0_20px_rgba(34,197,94,0.08)] translate-x-2" 
                : "border-white/10"
            )}
          >
            <p className={cn(
              "text-[10px] uppercase tracking-[0.24em] transition-colors duration-500",
              activeStep === 1 ? "text-brand" : "text-emerald-300/40"
            )}>
              explain
            </p>
            <div className="mt-2.5 flex flex-wrap gap-2">
              {[
                { name: 'Search', desc: 'Scan index' },
                { name: 'Inspect', desc: 'Eval docs' },
                { name: 'Rerank', desc: 'Sort matches' }
              ].map((sub, idx) => {
                const isSubActive = activeStep === 1 && subStep === idx;
                return (
                  <div 
                    key={sub.name}
                    className={cn(
                      "flex flex-col rounded-lg border px-2.5 py-1.5 transition-all duration-300 min-w-[70px]",
                      isSubActive 
                        ? "bg-brand/10 border-brand/40 text-brand scale-105 shadow-[0_0_10px_rgba(34,197,94,0.15)]"
                        : "bg-white/5 border-white/5 text-emerald-50/50"
                    )}
                  >
                    <span className="text-xs font-semibold">{sub.name}</span>
                    <span className={cn(
                      "text-[9px] mt-0.5",
                      isSubActive ? "text-brand/80" : "text-emerald-50/30"
                    )}>{sub.desc}</span>
                  </div>
                );
              })}
            </div>
          </div>
          {/* Connector Line */}
          <div className="absolute left-[17px] top-9 w-[2px] h-[36px] bg-white/5 pointer-events-none">
            <div 
              className={cn(
                "absolute w-full bg-brand shadow-[0_0_8px_var(--brand)] transition-all duration-1000 ease-in-out",
                activeStep === 1 ? "h-full top-0" : "h-0 top-full"
              )}
            />
          </div>
        </div>

        {/* Step 3 */}
        <div className="relative flex items-start gap-4 z-10">
          <span 
            className={cn(
              "grid size-9 shrink-0 place-items-center rounded-full border font-mono text-xs transition-all duration-500",
              activeStep === 2 
                ? "border-brand bg-brand/20 text-brand scale-110 shadow-[0_0_15px_rgba(34,197,94,0.3)]" 
                : "border-white/10 bg-white/5 text-emerald-50/40"
            )}
          >
            3
          </span>
          <div 
            className={cn(
              "min-w-0 flex-1 rounded-xl border p-4 transition-all duration-500 bg-white/5",
              activeStep === 2 
                ? "border-brand/40 bg-white/10 shadow-[0_0_20px_rgba(34,197,94,0.08)] translate-x-2" 
                : "border-white/10"
            )}
          >
            <p className={cn(
              "text-[10px] uppercase tracking-[0.24em] transition-colors duration-500",
              activeStep === 2 ? "text-brand" : "text-emerald-300/40"
            )}>
              connect
            </p>
            <div className="mt-3 flex items-center justify-between gap-1 text-[11px]">
              {[
                { label: 'RAG', desc: 'Context' },
                { label: 'Agents', desc: 'Execution' },
                { label: 'Evaluation', desc: 'Validation' }
              ].map((item, idx) => {
                const isSubActive = activeStep === 2 && subStep === idx;
                return (
                  <div key={item.label} className="flex items-center flex-1">
                    <div 
                      className={cn(
                        "flex flex-col items-center flex-1 rounded-lg border py-1 px-1.5 transition-all duration-300",
                        isSubActive 
                          ? "bg-brand/10 border-brand/40 text-brand scale-105 shadow-[0_0_10px_rgba(34,197,94,0.15)]"
                          : "bg-white/5 border-white/5 text-emerald-50/50"
                      )}
                    >
                      <span className="font-semibold">{item.label}</span>
                      <span className={cn(
                        "text-[8px] mt-0.5",
                        isSubActive ? "text-brand/80" : "text-emerald-50/30"
                      )}>{item.desc}</span>
                    </div>
                    {idx < 2 && (
                      <ArrowRight className={cn(
                        "size-3 mx-1 shrink-0 transition-colors duration-300",
                        (activeStep === 2 && subStep >= idx) ? "text-brand" : "text-emerald-50/20"
                      )} />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function OrangeDitheredBackground() {
  const { resolvedTheme } = useTheme();
  const [showShader, setShowShader] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShowShader(true), 250);
    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      <Image
        src={Greek2Image}
        alt=""
        fill
        className="absolute inset-0 size-full object-cover object-top -z-1 opacity-55 saturate-50 dark:opacity-45"
      />
      {showShader && (
        <ImageDithering
          image={Greek2Image.src}
          width="100%"
          height="100%"
          fit="cover"
          scale={1}
          colorBack="#00000000"
          colorFront={resolvedTheme === 'dark' ? '#140802' : '#230e03'}
          colorHighlight={resolvedTheme === 'dark' ? '#ff6c00' : '#e65c00'}
          type="4x4"
          size={6}
          colorSteps={2}
          originalColors={false}
          className="absolute inset-0 opacity-95 mix-blend-screen pointer-events-none -z-1"
          minPixelRatio={1}
          maxPixelCount={1280 * 720}
        />
      )}
    </>
  );
}
