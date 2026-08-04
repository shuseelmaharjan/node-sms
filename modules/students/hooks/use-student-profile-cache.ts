"use client";

import { useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { managementProfileKeys } from "../apis/management-profile.api";
import type {
  ManagedAddress,
  ManagedDocument,
  ManagedGuardian,
  ManagedHealth,
  ManagedProfile,
  ManagedUser,
  PersonalInfo,
} from "../types/management-profile.types";

export function useStudentProfileCache(
  studentId: string,
  managementUserId: string
) {
  const queryClient = useQueryClient();
  const profileKey = managementProfileKeys.detail(managementUserId);

  const updateProfile = useCallback(
    (updater: (current: ManagedProfile) => ManagedProfile) => {
      queryClient.setQueryData<ManagedProfile>(profileKey, (current) =>
        current ? updater(current) : current
      );
    },
    [profileKey, queryClient]
  );

  const setUser = useCallback(
    (user: ManagedUser) => {
      updateProfile((current) => ({ ...current, user }));
    },
    [updateProfile]
  );

  const setPersonalInfo = useCallback(
    (personalInfo: PersonalInfo) => {
      updateProfile((current) => ({
        ...current,
        personal_info: personalInfo,
      }));
    },
    [updateProfile]
  );

  const setAddress = useCallback(
    (address: ManagedAddress) => {
      const key = `${address.address_type}_address` as
        | "permanent_address"
        | "temporary_address"
        | "current_address";

      updateProfile((current) => ({
        ...current,
        [key]: address,
      }));
    },
    [updateProfile]
  );

  const setGuardian = useCallback(
    (guardian: ManagedGuardian) => {
      updateProfile((current) => ({
        ...current,
        guardians: current.guardians.some((item) => item.id === guardian.id)
          ? current.guardians.map((item) =>
              item.id === guardian.id ? guardian : item
            )
          : [...current.guardians, guardian],
      }));
    },
    [updateProfile]
  );

  const setDocument = useCallback(
    (document: ManagedDocument) => {
      updateProfile((current) => ({
        ...current,
        documents: current.documents.some((item) => item.id === document.id)
          ? current.documents.map((item) =>
              item.id === document.id ? document : item
            )
          : [...current.documents, document],
      }));
    },
    [updateProfile]
  );

  const setHealth = useCallback(
    (health: ManagedHealth) => {
      updateProfile((current) => ({ ...current, health }));
    },
    [updateProfile]
  );

  const refresh = useCallback(async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: profileKey }),
      queryClient.invalidateQueries({
        queryKey: ["students-360", "detail", studentId],
      }),
    ]);
  }, [profileKey, queryClient, studentId]);

  return {
    setUser,
    setPersonalInfo,
    setAddress,
    setGuardian,
    setDocument,
    setHealth,
    refresh,
  };
}
