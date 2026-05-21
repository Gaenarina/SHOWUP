"use client";

import NextLink from "next/link";
import {
  useParams as useNextParams,
  usePathname,
  useRouter,
} from "next/navigation";
import type { AnchorHTMLAttributes, ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";

type NavigateOptions = {
  replace?: boolean;
  state?: unknown;
};

type LinkProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & {
  children?: ReactNode;
  to: string;
};

const getStateKey = (path: string) => `showup:route-state:${path}`;

export function Link({ to, children, ...props }: LinkProps) {
  return (
    <NextLink href={to} {...props}>
      {children}
    </NextLink>
  );
}

export function useNavigate() {
  const router = useRouter();

  return (to: string | number, options?: NavigateOptions) => {
    if (typeof to === "number") {
      window.history.go(to);
      return;
    }

    if (options?.state !== undefined) {
      sessionStorage.setItem(getStateKey(to), JSON.stringify(options.state));
    }

    if (options?.replace) {
      router.replace(to);
      return;
    }

    router.push(to);
  };
}

export function useParams<T extends Record<string, string | string[]>>() {
  return useNextParams() as T;
}

export function useLocation() {
  const pathname = usePathname();
  const [state, setState] = useState<any>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    setSearch(window.location.search);

    const stored = sessionStorage.getItem(getStateKey(pathname));

    if (!stored) {
      setState(null);
      return;
    }

    try {
      setState(JSON.parse(stored));
    } catch {
      setState(null);
    }
  }, [pathname]);

  return {
    pathname,
    search,
    state,
  };
}

export function useSearchParams() {
  const router = useRouter();
  const pathname = usePathname();
  const [search, setSearch] = useState("");

  useEffect(() => {
    setSearch(window.location.search);
  }, [pathname]);

  const searchParams = useMemo(
    () => new URLSearchParams(search.startsWith("?") ? search.slice(1) : search),
    [search]
  );

  const setSearchParams = (next: URLSearchParams | Record<string, string>) => {
    const params =
      next instanceof URLSearchParams ? next : new URLSearchParams(next);
    const query = params.toString();

    router.push(query ? `${pathname}?${query}` : pathname);
  };

  return [searchParams, setSearchParams] as const;
}
