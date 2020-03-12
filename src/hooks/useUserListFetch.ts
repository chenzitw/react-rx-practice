import { useMemo } from 'react';

import useBatchFetch, {
  BatchFetchRes,
  BatchFetchException,
} from './useBatchFetch';

type UserItemReqData = undefined;

type UserItemResData = {
  id: number;
  name: string;
};

type UserItemException = 'UNKNOWN' | 'NOT_FOUND';

type UserListFetchReturn = {
  isLoading: boolean;
  result: null | {
    data: undefined | UserItemResData;
    exception: undefined | UserItemException;
  }[];
  fetch: (usernames: string[]) => void;
  refetch: () => void;
  reset: () => void;
};

const fetchResFormatter = (response: BatchFetchRes<UserItemResData>): UserItemResData => ({
  id: response.data.id,
  name: (response.data.name !== null) ? response.data.name : response.data.login,
});

const fetchErrFormatter = (fetchEexception: BatchFetchException): UserItemException => {
  if (fetchEexception.status === 404) { return 'NOT_FOUND'; }
  return 'UNKNOWN';
};

const useUserListFetch = (): UserListFetchReturn => {
  const {
    isLoading, result, fetch, refetch, reset,
  } = useBatchFetch<UserItemReqData, UserItemResData, UserItemException>(
    fetchResFormatter,
    fetchErrFormatter,
  );

  const fetchUserList = useMemo(() => (
    (usernames: string[]) => {
      fetch(usernames.map((username) => ({
        url: `https://api.github.com/users/${username}`,
      })));
    }
  ), [fetch]);

  return {
    isLoading: isLoading,
    result: result,
    fetch: fetchUserList,
    refetch: refetch,
    reset: reset,
  };
};

export default useUserListFetch;
