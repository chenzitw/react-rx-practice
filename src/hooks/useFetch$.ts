import {
  Subject, Observable, OperatorFunction, ObservableInput,
  from, of,
} from 'rxjs';
import {
  filter, map, takeUntil, catchError,
  mergeAll, switchAll, concatAll,
  share,
} from 'rxjs/operators';
import { useMemo, useEffect } from 'react';
import axios, { AxiosResponse, AxiosError } from 'axios';

const isAxiosError = (err: any): err is AxiosError => (true
  && (err !== undefined)
  && (err.response !== undefined)
);

export type FetchMode = 'merge' | 'switch' | 'concat';

export type FetchReq = {
  url: string;
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  headers?: {
    [key: string]: string;
  };
  params?: {
    [key: string]: string;
  };
  data?: any;
  withCredentials?: boolean;
  tag?: any;
};

export type FetchRes = {
  status: number;
  statusText: string;
  headers: {
    [key: string]: string;
  };
  data: any;
  tag?: any;
};

export class FetchException extends Error {
  public status: number

  public statusText: string

  public headers: {
    [key: string]: string;
  }

  public data: any

  public tag?: any

  public constructor(
    status: number,
    statusText: string,
    headers: {
      [key: string]: string;
    },
    data: any,
    tag?: any,
    message?: string,
  ) {
    super(message);
    this.name = 'FetchException';
    this.status = status;
    this.statusText = statusText;
    this.headers = headers;
    this.data = data;
    this.tag = tag;
  }
}

export const isFetchException = (err: any): err is FetchException => (true
  && err instanceof FetchException
);

type Fetch$Return = {
  reqSub: Subject<FetchReq>;
  cxlSub: Subject<undefined>;
  res$: Observable<FetchRes>;
  err$: Observable<FetchException>;
};

const fetchWithReq = async (req: FetchReq): Promise<FetchRes> => {
  const tag = req.tag;

  let result: AxiosResponse;
  try {
    result = await axios.request({
      url: req.url,
      method: (req.method !== undefined) ? req.method : 'GET',
      headers: (req.headers !== undefined) ? req.headers : undefined,
      params: (req.params !== undefined) ? req.params : undefined,
      data: (req.data !== undefined) ? req.data : undefined,
      withCredentials: (req.withCredentials !== undefined) ? req.withCredentials : false,
    });
  } catch (error) {
    if (isAxiosError(error) && (error.response !== undefined)) {
      throw new FetchException(
        error.response.status,
        error.response.statusText,
        error.response.headers,
        error.response.data,
        tag,
      );
    }
    throw new FetchException(500, 'Internal Server Error', {}, undefined, tag);
  }

  const res: FetchRes = {
    status: result.status,
    statusText: result.statusText,
    headers: result.headers,
    data: result.data,
    tag: tag,
  };

  return res;
};

const all = <T>(mode: FetchMode): OperatorFunction<ObservableInput<T>, T> => {
  switch (mode) {
    case 'merge': return mergeAll<T>();
    case 'switch': return switchAll<T>();
    case 'concat': return concatAll<T>();
    default: throw new Error();
  }
};

const useFetch$ = (mode: FetchMode = 'merge'): Fetch$Return => {
  const [reqSub, req$] = useMemo<[Subject<FetchReq>, Observable<FetchReq>]>(() => {
    const requestSubject = new Subject<FetchReq>();
    const request$ = requestSubject.asObservable();
    return [requestSubject, request$];
  }, []);

  const [cxlSub, cxl$] = useMemo<[Subject<undefined>, Observable<undefined>]>(() => {
    const cancelSubject = new Subject<undefined>();
    const cancel$ = cancelSubject.asObservable();

    return [cancelSubject, cancel$];
  }, []);

  const [resSub, res$] = useMemo<[Subject<FetchRes>, Observable<FetchRes>]>(() => {
    const responseSubject = new Subject<FetchRes>();
    const response$ = responseSubject.asObservable();

    return [responseSubject, response$];
  }, []);

  const [errSub, err$] = useMemo<[Subject<FetchException>, Observable<FetchException>]>(() => {
    const exceptionSubject = new Subject<FetchException>();
    const exception$ = exceptionSubject.asObservable();

    return [exceptionSubject, exception$];
  }, []);

  useEffect(() => {
    const response$ = req$.pipe(
      map((req) => from(fetchWithReq(req)).pipe(
        // delay(3000),
        catchError((error) => {
          const exception = (isFetchException(error)) ? error : (
            new FetchException(500, 'Internal Server Error', {}, undefined, undefined)
          );
          return of(exception);
        }),
        takeUntil(cxl$),
      )),
      all(mode),
      share(),
    );

    const responseSubscription = response$.pipe(
      filter((item): item is FetchRes => !isFetchException(item)),
      share(),
    ).subscribe(resSub);

    const exceptionSubscription = response$.pipe(
      filter((item): item is FetchException => isFetchException(item)),
      share(),
    ).subscribe(errSub);

    return () => {
      responseSubscription.unsubscribe();
      exceptionSubscription.unsubscribe();
    };
  }, [req$, cxl$, resSub]);

  useEffect(() => () => {
    reqSub.complete();
    cxlSub.complete();
    resSub.complete();
    errSub.complete();
  }, []);

  return {
    reqSub: reqSub,
    cxlSub: cxlSub,
    res$: res$,
    err$: err$,
  };
};

export default useFetch$;
