'use client';
import { currentUserQuery } from '@/api/auth';
import { useQuery } from '@tanstack/react-query';

const useUser = () => {
  const {
    data: user,
    isPending: isLoading,
    isError,
    isFetching,
    refetch: refetchUser,
  } = useQuery(currentUserQuery);
  return { user, isLoading, isError, isFetching, refetchUser };
};

export default useUser;
