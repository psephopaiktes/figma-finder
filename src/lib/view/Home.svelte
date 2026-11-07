<script lang="ts">
import Fuse from "fuse.js";
import { tick, untrack } from "svelte";
import i18n from "@/lib/i18n.svelte";
import Layout from "@/lib/Layout.svelte";
import { FigmaRateLimitError, loadFiles, store } from "@/lib/store.svelte";
import ErrorView from "@/lib/ui/Home/ErrorView.svelte";
import Input from "@/lib/ui/Home/Input.svelte";
import NewFAB from "@/lib/ui/Home/NewFAB.svelte";
import SubHeader from "@/lib/ui/Home/SubHeader.svelte";
import Tree from "@/lib/ui/Home/Tree.svelte";
import ViewSwitcher from "@/lib/ui/Home/ViewSwitcher.svelte";
import Loader from "@/lib/ui/Loader.svelte";
import Nav from "@/lib/ui/Nav/Index.svelte";
import type { File, Project } from "@/types";

let loading = $state(true);
let refreshing = $state(false);
let query = $state("");
let isTimeout = $state(false);
let isRateLimited = $state(false);
const rateLimitText = {
  en: "Figma's request limit was reached. Please wait before reloading.",
  ja: "Figmaへのリクエスト上限に達しました。時間を置いて再読み込みしてください。",
  "zh-cn": "已达到 Figma 的请求上限。请稍后再重新加载。",
  es: "Se ha alcanzado el límite de solicitudes de Figma. Espera antes de recargar.",
  ko: "Figma 요청 한도에 도달했습니다. 잠시 후 다시 불러와 주세요.",
};
const refreshErrorText = {
  en: "Could not refresh. Showing saved files. Please try again later.",
  ja: "更新できませんでした。保存済みのファイルを表示しています。時間を置いて再度お試しください。",
  "zh-cn": "无法刷新。正在显示已保存的文件。请稍后重试。",
  es: "No se pudo actualizar. Se muestran los archivos guardados. Inténtalo más tarde.",
  ko: "새로 불러오지 못했습니다. 저장된 파일을 표시합니다. 잠시 후 다시 시도해 주세요.",
};
let isInputed: boolean = $derived.by(() => {
  return query.trim().length > 0;
});

async function refresh(force = false) {
  if (refreshing) return;
  refreshing = true;
  loading = true;
  isTimeout = false;
  isRateLimited = false;
  const timeoutId = setTimeout(() => {
    isTimeout = true;
    loading = false;
  }, 10000);

  try {
    await loadFiles({ force });
    isTimeout = false;
  } catch (error) {
    isRateLimited = error instanceof FigmaRateLimitError;
    isTimeout = !isRateLimited;
    if (!isRateLimited) console.warn("Files could not be refreshed.");
  } finally {
    loading = false;
    refreshing = false;
    clearTimeout(timeoutId);
  }
}

$effect(() => {
  // Layout loads accounts and refreshes credentials before publishing readiness.
  if (store.loading) return;
  void untrack(() => refresh());
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
      const targetFile = project.files[fileId];
      if (targetFile) {
        filteredFiles[fileId] = targetFile;
      }
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

<Layout onReload={() => refresh(true)}>
  <Nav current="home">
    <Input bind:value={query} submit={openFirstFile} />
  </Nav>

  <div class="requestStatus" role="status">
    {#if isRateLimited && Object.keys(store.projects).length !== 0}
      <p>{i18n.t(rateLimitText)}</p>
    {:else if isTimeout && !refreshing && Object.keys(store.projects).length !== 0}
      <p>{i18n.t(refreshErrorText)}</p>
    {/if}
  </div>

  {#if Object.keys(store.projects).length !== 0}
    <SubHeader onReload={() => refresh(true)} loading={refreshing} />
    <Tree projects={filterdProjects} {isInputed} />
  {:else if loading}
    <section class="l-centeringContainer">
      <Loader />
    </section>
  {:else if !navigator.onLine}
    <ErrorView
      onReload={() => refresh(true)}
      loading={refreshing}
      icon="offline"
      mainText={{
        en: "You are offline.",
        ja: "オフラインです。",
        "zh-cn": "您处于离线状态。",
        es: "Estás desconectado.",
        ko: "오프라인 상태입니다。",
      }}
    />
  {:else if isRateLimited}
    <ErrorView
      onReload={() => refresh(true)}
      loading={refreshing}
      mainText={rateLimitText}
    />
  {:else if isTimeout}
    <ErrorView
      onReload={() => refresh(true)}
      loading={refreshing}
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
      onReload={() => refresh(true)}
      loading={refreshing}
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

  <ViewSwitcher />
  <NewFAB />
</Layout>

<style>
  .requestStatus p {
    margin: var(--sp-m);
    color: var(--color-caution);
  }
</style>


