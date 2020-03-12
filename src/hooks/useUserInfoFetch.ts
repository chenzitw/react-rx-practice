import { useMemo } from 'react';

import useGeneralFetch, {
  GeneralFetchRes,
  GeneralFetchException,
} from './useGeneralFetch';

type UserInfoReqData = undefined;

type UserInfoResData = {
  id: number;
  name: string;
};

type UserInfoException = 'UNKNOWN' | 'NOT_FOUND';

type UserInfoFetchReturn = {
  isLoading: boolean;
  data: undefined | UserInfoResData;
  exception: undefined | UserInfoException;
  fetch: (username: string) => void;
  refetch: () => void;
  reset: () => void;
};

const fetchResFormatter = (response: GeneralFetchRes<UserInfoResData>): UserInfoResData => ({
  id: response.data.id,
  name: (response.data.name !== null) ? response.data.name : response.data.login,
});

const fetchErrFormatter = (fetchEexception: GeneralFetchException): UserInfoException => {
  if (fetchEexception.status === 404) { return 'NOT_FOUND'; }
  return 'UNKNOWN';
};

const useUserInfoFetch = (): UserInfoFetchReturn => {
  const {
    isLoading, data, exception, fetch, refetch, reset,
  } = useGeneralFetch<UserInfoReqData, UserInfoResData, UserInfoException>(
    fetchResFormatter,
    fetchErrFormatter,
  );

  const fetchUserInfo = useMemo(() => (
    (username: string) => {
      fetch({
        url: `https://api.github.com/users/${username}`,
      });
    }
  ), []);

  return {
    isLoading: isLoading,
    data: data,
    exception: exception,
    fetch: fetchUserInfo,
    refetch: refetch,
    reset: reset,
  };
};

export default useUserInfoFetch;
