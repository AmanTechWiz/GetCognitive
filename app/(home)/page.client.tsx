'use client';

import {
  type ComponentProps,
  Fragment,
  type HTMLAttributes,
  type ReactElement,
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
import HeroImage from './hero-preview.jpeg';
import AgentHeroImage from './agent-hero.png';
import SecondSectionBg from './2nd-section-bg.png';
import { useTheme } from 'next-themes';
import dynamic from 'next/dynamic';

const GrainGradient = dynamic(
  () => import('@paper-design/shaders-react').then((mod) => mod.GrainGradient),
  {
    ssr: false,
  },
);
const ImageDithering = dynamic(
  () => import('@paper-design/shaders-react').then((mod) => mod.ImageDithering),
  {
    ssr: false,
  },
);

export function Hero() {
  const { resolvedTheme } = useTheme();
  const ref = useRef<HTMLImageElement | null>(null);
  const visible = useIsVisible(ref);
  const [showShaders, setShowShaders] = useState(false);
  const [imageReady, setImageReady] = useState(false);

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
      <Image
        ref={ref}
        src={HeroImage}
        alt="hero-image"
        className={cn(
          'absolute top-[460px] left-[20%] max-w-[1200px] rounded-xl border-2 lg:top-[400px]',
          imageReady ? 'animate-in fade-in duration-400' : 'invisible',
        )}
        onLoad={() => setImageReady(true)}
        priority
      />
    </>
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
