<script lang="ts">
import i18n from "@/lib/i18n.svelte";
import { store, user } from "@/lib/store.svelte";
import { slide } from "svelte/transition";

let inputtedTeamId = $state("");

async function addTeam(e: SubmitEvent) {
  e.preventDefault();
  const currentUser = user();
  if (!currentUser) return;

  if (currentUser.teams[inputtedTeamId]) {
    alert(
      i18n.t({
        en: "This team is already registered.",
        ja: "このチームはすでに登録されています。",
        "zh-cn": "该团队已注册。",
        es: "Este equipo ya está registrado.",
        ko: "이 팀은 이미 등록되어 있습니다。",
      }),
    );
    inputtedTeamId = "";
    return;
  }

  const res = await fetch(
    `https://api.figma.com/v1/teams/${inputtedTeamId}/projects`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${currentUser.access_token}`,
      },
    },
  );
  if (!res.ok) {
    alert(
      `${i18n.t({
        en: "Failed to fetch the team.\nError code",
        ja: "チームを取得できませんでした。\nエラーコード",
        "zh-cn": "无法获取团队。\n错误代码",
        es: "No se pudo obtener el equipo.\nCódigo de error",
        ko: "팀을 가져오지 못했습니다.\n오류 코드",
      })}: ${res.status}`,
    );
    return;
  }
  const data = await res.json();

  currentUser.teams[inputtedTeamId] = data.name;
  storage.setItem("sync:options", store.options);
  inputtedTeamId = "";
}

function removeTeam(id: string) {
  const currentUser = user();
  if (!currentUser) return;
  delete currentUser.teams[id];
}
</script>

<p>
  {i18n.t({
    en: "Enter the ID of the team you want to search for and add it.",
    ja: "検索したいチームのIDを入力し、追加してください。",
    "zh-cn": "输入您想搜索的团队 ID 并添加它。",
    es: "Ingrese la ID del equipo que desea buscar y agréguelo.",
    ko: "검색하려는 팀의 ID를 입력하고 추가하세요。",
  })}
</p>
<p>
  <a href="/help.html#team-id" target="_blank">
    {i18n.t({
      en: "What is Team ID?",
      ja: "チーム ID とは？",
      "zh-cn": "什么是团队 ID？",
      es: "¿Qué es la ID del equipo?",
      ko: "팀 ID란 무엇인가요?",
    })}
  </a>
</p>

<section>
  <p>
    {i18n.t({
      en: "Current User",
      ja: "現在のユーザー",
      "zh-cn": "当前用户",
      es: "Usuario actual",
      ko: "현재 사용자",
    })}: <b>{user()?.email}</b>
  </p>

  <form onsubmit={addTeam}>
    <input
      type="text"
      placeholder="Team ID"
      class="c-input"
      bind:value={inputtedTeamId}
    />
    <button
      class="c-button -gray -small"
      type="submit"
      disabled={!inputtedTeamId}
    >
      <svg-icon src="/img/icon/add.svg"></svg-icon>
      {i18n.t({
        en: "Add",
        ja: "追加",
        "zh-cn": "添加",
        es: "Agregar",
        ko: "추가",
      })}
    </button>
  </form>

  <ul class="teamList">
    {#each Object.entries(user()?.teams || {}) as [id, name]}
      <li transition:slide>
        <b>{name}</b>
        <small>{id}</small>
        <button
          class="c-button -caution -small c-tooltip"
          onclick={() => removeTeam(id)}
          title={i18n.t({
            en: "Remove",
            ja: "削除",
            "zh-cn": "删除",
            es: "Eliminar",
            ko: "삭제",
          })}
        >
          <svg-icon src="/img/icon/remove.svg">
            {i18n.t({
              en: "Remove",
              ja: "削除",
              "zh-cn": "删除",
              es: "Eliminar",
              ko: "삭제",
            })}
          </svg-icon>
        </button>
      </li>
    {/each}
  </ul>
</section>

<style>
  section {
    margin-block-start: var(--sp-m);
    max-width: 320px;
  }

  form {
    margin-block-start: var(--sp-s);
    position: relative;
    input {
      width: 100%;
      height: 36px;
      padding-inline-end: 72px;
    }
    button {
      position: absolute;
      right: 4px;
      top: 4px;
    }
  }

  .teamList {
    margin-block-start: var(--sp-s);
    padding: 0;
    li {
      margin-block-start: var(--sp-xs);
      padding: 4px;
      padding-inline-start: 8px;
      border-radius: 8px;
      border: 2px solid rgb(from var(--color-main) r g b / 5%);
      display: flex;
      gap: 4px;
      justify-content: center;
      align-items: center;
      b,
      small {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      small {
        opacity: 0.4;
        flex: 1;
      }
    }
  }
</style>
