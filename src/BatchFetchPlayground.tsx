import React, { FunctionComponent } from 'react';
import { useEventCallback } from 'rxjs-hooks';
import {
  withLatestFrom, debounceTime, tap, map, filter, ignoreElements,
} from 'rxjs/operators';

import useUserListFetch from './hooks/useUserListFetch';

const Playground: FunctionComponent = () => {
  const {
    isLoading, result, fetch, refetch, reset,
  } = useUserListFetch();

  const [handleFetch] = useEventCallback<React.SyntheticEvent<HTMLButtonElement>, void>(
    (event$) => event$.pipe(
      map((event) => {
        const val = event.currentTarget.getAttribute('data-val');
        return val;
      }),
      filter((val): val is string => (typeof val === 'string')),
      map((val) => val.split(',').filter((item) => (item !== ''))),
      debounceTime(500),
      tap((usernames) => { fetch(usernames); }),
      ignoreElements(),
    ),
    undefined,
  );

  const [handleRefetch] = useEventCallback<React.SyntheticEvent<HTMLButtonElement>, void>(
    (event$) => event$.pipe(
      debounceTime(500),
      tap(() => { refetch(); }),
      ignoreElements(),
    ),
    undefined,
  );

  const [handleReset] = useEventCallback<React.SyntheticEvent<HTMLButtonElement>, void>(
    (event$) => event$.pipe(
      debounceTime(500),
      tap(() => { reset(); }),
      ignoreElements(),
    ),
    undefined,
  );

  type Input = [typeof isLoading, typeof result];
  const [handleLogState] = useEventCallback<React.SyntheticEvent<HTMLButtonElement>, void, Input>(
    (event$, _state$, inputs$) => event$.pipe(
      debounceTime(50),
      withLatestFrom(inputs$),
      tap(([, [isLoadingVal, resultVal]]) => {
        // eslint-disable-next-line no-console
        console.log({
          isLoading: isLoadingVal,
          result: resultVal,
        });
      }),
      ignoreElements(),
    ),
    undefined,
    [isLoading, result],
  );

  return (
    <>
      <div>
        <h2>Batch fetch</h2>
      </div>
      <div>
        <h3>Status: </h3>
        <p>isLoading =&gt; {(isLoading) ? 'true' : 'false'}</p>
        <p>result =&gt; {
          (result !== null) ? (
            `[${result.map((item) => (
              (typeof item.data !== 'undefined') ? (
                `${item.data.id}:${item.data.name}`
              ) : (
                `err:${item.exception}`
              )
            )).join(',')}]`
          ) : '(none)'
        }</p>
      </div>
      <div>
        <h3>Action: </h3>
        <p>
          <button
            onClick={handleFetch}
            data-val="chenzitw"
          >
            Fetch (ChenZi)
          </button>
          <button
            onClick={handleFetch}
            data-val="chenzitw,ChiFangChen,benjamin658"
          >
            Fetch (ChenZi,ChiFangChen,BenBenHu)
          </button>
          <button
            onClick={handleFetch}
            data-val="_1,_2,_3"
          >
            Fetch (404,404,404)
          </button>
          <button
            onClick={handleFetch}
            data-val="chenzitw,_1,ChiFangChen,_2,benjamin658"
          >
            Fetch (ChenZi,404,ChiFangChen,404,BenBenHu)
          </button>
          <button onClick={handleRefetch}>Refetch</button>
          <button onClick={handleReset}>Clear</button>
          <button onClick={handleLogState}>Console.log(state)</button>
        </p>
      </div>
    </>
  );
};

export default Playground;
