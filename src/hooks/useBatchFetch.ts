import { empty } from 'rxjs';
import {
  tap, map, catchError,
} from 'rxjs/operators';
import {
  useState, useRef, useMemo, useEffect,
} from 'react';

import useFetch$, { FetchReq, FetchRes, FetchException } from './useFetch$';

export type BatchFetchReq<ReqData> = ReqData extends undefined ? FetchReq : FetchReq & {
  data: ReqData;
};

export type BatchFetchRes<ResData> = ResData extends undefined ? FetchRes : FetchRes & {
  data: ResData;
};

export type BatchFetchException = FetchException;

type FetchResultItem<ResData, Exception> = {
  data: ResData;
  exception: undefined;
} | {
  data: undefined;
  exception: Exception;
};

export type BatchFetchReturn<ReqData, ResData, Exception> = {
  isLoading: boolean;
  result: null | FetchResultItem<ResData, Exception>[];
  fetch: (reqs: BatchFetchReq<ReqData>[]) => void;
  refetch: () => void;
  reset: () => void;
};

const useGeneralFetch = <ReqData = any, ResData = any, Exception = any>(
  dataFormatter: (res: FetchRes) => ResData = ((res) => res.data as unknown as ResData),
  exceptionFormatter: (err: FetchException) => Exception = ((err) => err as unknown as Exception),
): BatchFetchReturn<ReqData, ResData, Exception> => {
  type ResultItem = FetchResultItem<ResData, Exception>;

  const [isLoading, setLoading] = useState<boolean>(false);
  const [result, setResult] = useState<null | ResultItem[]>(null);
  const resultQueueRef = useRef<null | ResultItem[]>(null);
  const [reqs, setReqs] = useState<null | BatchFetchReq<ReqData>[]>(null);
  const resetRef = useRef<() => void>(() => undefined);
  const refetchRef = useRef<() => void>(() => undefined);
  const fetchRef = useRef<(reqs: BatchFetchReq<ReqData>[]) => void>(() => undefined);

  const {
    reqSub, cxlSub, res$, err$,
  } = useFetch$('concat');

  const addIntoResultQueueRef = useRef<(item: ResultItem) => void>(() => undefined);

  useEffect(() => {
    addIntoResultQueueRef.current = (nextResultItem) => {
      if (resultQueueRef.current === null) {
        resultQueueRef.current = [];
      }
      resultQueueRef.current.push(nextResultItem);
      if (true
        && isLoading === true
        && reqs !== null
        && resultQueueRef.current !== null
        && resultQueueRef.current.length >= reqs.length
      ) {
        cxlSub.next();
        setLoading(false);
        setResult(resultQueueRef.current);
      }
    };
  }, [isLoading, setLoading, reqs, setResult, cxlSub]);

  useEffect(() => {
    const responseSubscription = res$.pipe(
      map((nextResponse) => dataFormatter(nextResponse)),
      tap((nextData) => {
        const nextResultItem: ResultItem = {
          data: nextData,
          exception: undefined,
        };
        addIntoResultQueueRef.current(nextResultItem);
      }),
      catchError(() => {
        const formattingFailedException = new FetchException(0, 'Formatting Failed', {}, undefined);
        const nextResultItem: ResultItem = {
          data: undefined,
          exception: exceptionFormatter(formattingFailedException),
        };
        addIntoResultQueueRef.current(nextResultItem);
        return empty();
      }),
    ).subscribe();

    const exceptionSubscription = err$.pipe(
      tap((nextException) => {
        const nextResultItem: ResultItem = {
          data: undefined,
          exception: exceptionFormatter(nextException),
        };
        addIntoResultQueueRef.current(nextResultItem);
      }),
    ).subscribe();

    return () => {
      responseSubscription.unsubscribe();
      exceptionSubscription.unsubscribe();
    };
  }, [res$, err$, dataFormatter, exceptionFormatter]);

  useEffect(() => {
    resetRef.current = () => {
      cxlSub.next();
      setLoading(false);
      setResult(null);
      resultQueueRef.current = null;
      setReqs(null);
    };
  }, [setLoading, setResult, setReqs, cxlSub]);

  useEffect(() => {
    refetchRef.current = () => {
      if (reqs === null) { return; }
      cxlSub.next();
      setLoading(true);
      resultQueueRef.current = null;
      reqs.forEach((req) => {
        reqSub.next(req);
      });
    };
  }, [setLoading, reqs, reqSub, cxlSub]);

  useEffect(() => {
    fetchRef.current = (nextReqs: BatchFetchReq<ReqData>[]) => {
      cxlSub.next();
      setLoading(true);
      resultQueueRef.current = null;
      setReqs(nextReqs);
      nextReqs.forEach((req) => {
        reqSub.next(req);
      });
    };
  }, [setLoading, setReqs, reqSub, cxlSub]);

  const fetch = useMemo(() => (
    (nextReqs: BatchFetchReq<ReqData>[]) => { fetchRef.current(nextReqs); }
  ), []);

  const refetch = useMemo(() => (
    () => { refetchRef.current(); }
  ), []);

  const reset = useMemo(() => (
    () => { resetRef.current(); }
  ), []);

  return {
    isLoading: isLoading,
    result: result,
    fetch: fetch,
    refetch: refetch,
    reset: reset,
  };
};

export default useGeneralFetch;
