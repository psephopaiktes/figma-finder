<script lang="ts">
import i18n from "@/lib/i18n.svelte";
import { loadFiles } from "@/lib/store.svelte";
import { store } from "@/lib/store.svelte";
import type { File, Project } from "@/types";
import Fuse from "fuse.js";
import { onMount } from "svelte";
import { tick } from "svelte";

import Layout from "@/lib/Layout.svelte";
import ErrorView from "@/lib/ui/Home/ErrorView.svelte";
import Input from "@/lib/ui/Home/Input.svelte";
import NewFAB from "@/lib/ui/Home/NewFAB.svelte";
import SubHeader from "@/lib/ui/Home/SubHeader.svelte";
import Tree from "@/lib/ui/Home/Tree.svelte";
import Loader from "@/lib/ui/Loader.svelte";
import Nav from "@/lib/ui/Nav/Index.svelte";

let loading = $state(true);
let query = $state("");
let isTimeout = $state(false);
let isInputed: boolean = $derived.by(() => {
  return query.trim().length > 0;
});

onMount(async () => {
  const timeoutId = setTimeout(() => {
    isTimeout = true;
    loading = false;
  }, 10000);

  await loadFiles();
  loading = false;

  if (timeoutId) clearTimeout(timeoutId);
});

let filterdProjects: Record<string, Project> = $derived.by(() => {
  if (!isInputed) {
    return store.projects;
  }

  const filteredProjects: Record<string, Project> = {};

  for (const [projectId, project] of Object.entries(store.projects)) {
    const fileItems = Object.entries(project.files).map(([fileId, file]) => ({
      id: fileId,
      name: file.name,
    }));

    const options = {
      keys: ["name"],
      includeScore: true,
      threshold: 0.2,
      ignoreLocation: true,
      useExtendedSearch: true,
    };
    const fuse = new Fuse(fileItems, options);
    const searchResults = fuse.search(query);

    const filteredFiles: Record<string, File> = {};
    for (const result of searchResults) {
      const fileId = result.item.id;
      filteredFiles[fileId] = project.files[fileId];
    }

    if (Object.keys(filteredFiles).length > 0) {
      filteredProjects[projectId] = {
        ...project,
        files: filteredFiles,
      };
    }
  }

  return filteredProjects;
});

const openFirstFile = () => {
  tick().then(() => {
    const firstFile = document.querySelector(".projects > li .files > li a");
    if (!firstFile) return;
    window.open(firstFile.getAttribute("href") || "");
  });
};
</script>

<Layout>
  <Nav current="home">
    <Input bind:value={query} submit={openFirstFile} />
  </Nav>

  {#if Object.keys(store.projects).length !== 0}
    <SubHeader />
    <Tree projects={filterdProjects} {isInputed} />
  {:else if loading}
    <section class="l-centeringContainer">
      <Loader />
    </section>
  {:else if !navigator.onLine}
    <ErrorView
      icon="offline"
      mainText={{
        en: "You are offline.",
        ja: "オフラインです。",
        "zh-cn": "您处于离线状态。",
        es: "Estás desconectado.",
        ko: "오프라인 상태입니다。",
      }}
    />
  {:else if isTimeout}
    <ErrorView
      mainText={{
        en: "Timeout. Please reload.",
        ja: "タイムアウトしました。再読み込みしてください。",
        "zh-cn": "超时。请重新加载。",
        es: "Tiempo de espera agotado. Por favor, recargue.",
        ko: "시간 초과되었습니다. 새로고침 해주세요。",
      }}
      subText={{
        en: "If this error occurs repeatedly, try logging out or changing the team ID.",
        ja: "このエラーが何度も発生する場合は、一度ログアウトするかチームIDを変更してください。",
        "zh-cn": "如果这个错误经常发生，请尝试注销或更改团队ID。",
        es: "Si este error ocurre repetidamente, intenta cerrar sesión o cambiar el ID del equipo.",
        ko: "이 오류가 반복되면 로그아웃하거나 팀 ID를 변경해보세요。",
      }}
    />
  {:else}
    <ErrorView
      mainText={{
        en: "No projects found.",
        ja: "プロジェクトがありません。",
        "zh-cn": "没有找到项目。",
        es: "No se encontraron proyectos.",
        ko: "프로젝트가 없습니다。",
      }}
      subText={{
        en: "If this error occurs repeatedly, try logging out or changing the team ID.",
        ja: "このエラーが何度も発生する場合は、一度ログアウトするかチームIDを変更してください。",
        "zh-cn": "如果这个错误经常发生，请尝试注销或更改团队ID。",
        es: "Si este error ocurre repetidamente, intenta cerrar sesión o cambiar el ID del equipo.",
        ko: "이 오류가 반복되면 로그아웃하거나 팀 ID를 변경해보세요。",
      }}
    />
  {/if}

  <NewFAB />
</Layout>

<style>
  p {
    opacity: 0.6;
  }
</style>
