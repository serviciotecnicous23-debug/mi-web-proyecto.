import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import type { RadioCategory, RadioCategoryId, RadioLibraryTrack, RadioStationPayload } from "@shared/radio";

type RadioLibraryPayload = {
  categories: RadioCategory[];
  tracks: RadioLibraryTrack[];
  trackCount: number;
  uploadMaxMb: number;
};

export function useRadioStation() {
  return useQuery<RadioStationPayload>({
    queryKey: [api.radio.station.path],
    queryFn: async () => {
      const res = await fetch(api.radio.station.path, { credentials: "include" });
      if (!res.ok) throw new Error("Error al cargar la emisora");
      return res.json();
    },
    refetchInterval: 15000,
    staleTime: 10000,
  });
}

export function useAdminRadioLibrary() {
  return useQuery<RadioLibraryPayload>({
    queryKey: [api.admin.listRadioLibrary.path],
    queryFn: async () => {
      const res = await fetch(api.admin.listRadioLibrary.path, { credentials: "include" });
      if (!res.ok) throw new Error("Error al cargar la biblioteca de radio");
      return res.json();
    },
  });
}

export function useUploadRadioTracks() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ category, files }: { category: RadioCategoryId; files: File[] }) => {
      const form = new FormData();
      files.forEach((file) => form.append("files", file));
      const url = buildUrl(api.admin.uploadRadioTrack.path, { category });
      const res = await fetch(url, {
        method: "POST",
        body: form,
        credentials: "include",
      });
      if (!res.ok) {
        const message = await res.text();
        throw new Error(message || "Error al subir audio");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.admin.listRadioLibrary.path] });
      queryClient.invalidateQueries({ queryKey: [api.radio.station.path] });
    },
  });
}

export function useDeleteRadioTrack() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ category, fileName }: { category: RadioCategoryId; fileName: string }) => {
      const url = buildUrl(api.admin.deleteRadioTrack.path, {
        category,
        fileName: encodeURIComponent(fileName),
      });
      const res = await fetch(url, { method: "DELETE", credentials: "include" });
      if (!res.ok) {
        const message = await res.text();
        throw new Error(message || "Error al eliminar audio");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.admin.listRadioLibrary.path] });
      queryClient.invalidateQueries({ queryKey: [api.radio.station.path] });
    },
  });
}
