import { empty } from 'rxjs';
import { tap, map, catchError } from 'rxjs/operators';
import {
  useState, useRef, useMemo, useEffect,
} from 'react';

import useFetch$, { FetchReq, FetchRes, FetchException } from './useFetch$';

export type GeneralFetchReq<ReqData> = ReqData extends undefined ? FetchReq : FetchReq & {
  data: ReqData;
};

export type GeneralFetchRes<ResData> = ResData extends undefined ? FetchRes : FetchRes & {
  data: ResData;
};

export type GeneralFetchException = FetchException;

export type GeneralFetchReturn<ReqData, ResData, Exception> = {
  isLoading: boolean;
  data: undefined | ResData;
  exception: undefined | Exception;
  fetch: (req: GeneralFetchReq<ReqData>) => void;
  refetch: () => void;
  reset: () => void;
};

const useGeneralFetch = <ReqData = any, ResData = any, Exception = any>(
  dataFormatter: (res: FetchRes) => ResData = ((res) => res.data as unknown as ResData),
  exceptionFormatter: (err: FetchException) => Exception = ((err) => err as unknown as Exception),
): GeneralFetchReturn<ReqData, ResData, Exception> => {
  const [isLoading, setLoading] = useState<boolean>(false);
  const [data, setData] = useState<undefined | ResData>(undefined);
  const [exception, setException] = useState<undefined | Exception>(undefined);
  const [req, setReq] = useState<null | GeneralFetchReq<ReqData>>(null);
  const resetRef = useRef<() => void>(() => undefined);
  const refetchRef = useRef<() => void>(() => undefined);
  const fetchRef = useRef<(req: GeneralFetchReq<ReqData>) => void>(() => undefined);
  const {
    reqSub, cxlSub, res$, err$,
  } = useFetch$('switch');

  useEffect(() => {
    const responseSubscription = res$.pipe(
      map((nextResponse) => dataFormatter(nextResponse)),
      tap((nextData) => {
        setData(nextData);
        setException(undefined);
        setLoading(false);
      }),
      catchError(() => {
        const formattingFailedException = new FetchException(0, 'Formatting Failed', {}, undefined);
        setException(exceptionFormatter(formattingFailedException));
        setLoading(false);
        return empty();
      }),
    ).subscribe();

    const exceptionSubscription = err$.pipe(
      tap((nextException) => {
        setException(exceptionFormatter(nextException));
        setLoading(false);
      }),
    ).subscribe();

    return () => {
      responseSubscription.unsubscribe();
      exceptionSubscription.unsubscribe();
    };
  }, [res$, err$, dataFormatter, exceptionFormatter, setLoading, setData, setException]);

  useEffect(() => {
    resetRef.current = () => {
      setLoading(false);
      setData(undefined);
      setException(undefined);
      setReq(null);
      cxlSub.next();
    };
  }, [setLoading, setData, setException, setReq, cxlSub]);

  useEffect(() => {
    refetchRef.current = () => {
      if (req === null) { return; }
      setLoading(true);
      reqSub.next(req);
    };
  }, [setLoading, req, reqSub]);

  useEffect(() => {
    fetchRef.current = (nextReq: GeneralFetchReq<ReqData>) => {
      setLoading(true);
      setReq(nextReq);
      reqSub.next(nextReq);
    };
  }, [setLoading, setReq, reqSub]);

  const fetch = useMemo(() => (
    (nextReq: GeneralFetchReq<ReqData>) => { fetchRef.current(nextReq); }
  ), []);

  const refetch = useMemo(() => (
    () => { refetchRef.current(); }
  ), []);

  const reset = useMemo(() => (
    () => { resetRef.current(); }
  ), []);

  return {
    isLoading: isLoading,
    data: data,
    exception: exception,
    fetch: fetch,
    refetch: refetch,
    reset: reset,
  };
};

export default useGeneralFetch;
