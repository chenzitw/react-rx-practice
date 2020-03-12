import React, { FunctionComponent } from 'react';
import { useEventCallback } from 'rxjs-hooks';
import {
  withLatestFrom, debounceTime, tap, map, filter, ignoreElements,
} from 'rxjs/operators';

import useUserInfoFetch from './hooks/useUserInfoFetch';

const Playground: FunctionComponent = () => {
  const {
    isLoading, data, exception, fetch, refetch, reset,
  } = useUserInfoFetch();

  const [handleFetch] = useEventCallback<React.SyntheticEvent<HTMLButtonElement>, void>(
    (event$) => event$.pipe(
      map((event) => {
        const val = event.currentTarget.getAttribute('data-val');
        return val;
      }),
      filter((val): val is string => (typeof val === 'string')),
      // debounceTime(500),
      tap((username) => { fetch(username); }),
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

  type Input = [typeof isLoading, typeof data, typeof exception];
  const [handleLogState] = useEventCallback<React.SyntheticEvent<HTMLButtonElement>, void, Input>(
    (event$, _state$, inputs$) => event$.pipe(
      debounceTime(50),
      withLatestFrom(inputs$),
      tap(([, [isLoadingVal, dataVal, exceptionVal]]) => {
        // eslint-disable-next-line no-console
        console.log({
          isLoading: isLoadingVal,
          data: dataVal,
          exception: exceptionVal,
        });
      }),
      ignoreElements(),
    ),
    undefined,
    [isLoading, data, exception],
  );

  return (
    <>
      <div>
        <h2>General fetch</h2>
      </div>
      <div>
        <h3>Status: </h3>
        <p>isLoading =&gt; {(isLoading) ? 'true' : 'false'}</p>
        <p>data =&gt; {
          (data !== undefined) ? `{ id: ${data.id}, name: '${data.name}' }` : '(none)'
        }</p>
        <p>exception =&gt; {(exception !== undefined) ? exception : '(none)'}</p>
      </div>
      <div>
        <h3>Action: </h3>
        <p>
          <button onClick={handleFetch} data-val="chenzitw">Fetch (ChenZi)</button>
          <button onClick={handleFetch} data-val="ChiFangChen">Fetch (ChiFangChen)</button>
          <button onClick={handleFetch} data-val="admin">Fetch (404)</button>
          <button onClick={handleRefetch}>Refetch</button>
          <button onClick={handleReset}>Clear</button>
          <button onClick={handleLogState}>Console.log(state)</button>
        </p>
      </div>
    </>
  );
};

export default Playground;
