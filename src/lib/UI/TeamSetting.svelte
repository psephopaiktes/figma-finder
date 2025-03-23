<script lang="ts">
  import i18n from "@/lib/i18n.svelte";
  import { store, user } from "@/lib/store.svelte";

  let inputtedTeamId = $state("");

  async function addTeam(e: SubmitEvent) {
    e.preventDefault();
    const currentUser = user();
    if (!currentUser) return;

    const res = await fetch(
      `https://api.figma.com/v1/teams/${inputtedTeamId}/projects`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${currentUser.access_token}`,
        },
      },
    );
    console.dir(res);
    if (!res.ok) {
      alert(
        `${i18n.t({
          en: "Failed to fetch the team.\nError code",
          ja: "チームを取得できませんでした。\nエラーコード",
          "zh-cn": "无法获取团队。\n错误代码",
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

<section>
  <p>
    {i18n.t({
      en: "Current User",
      ja: "現在のユーザー",
      "zh-cn": "当前用户",
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
      {i18n.t({ en: "Add", ja: "追加", "zh-cn": "添加" })}
    </button>
  </form>

  <ul class="teamList">
    {#each Object.entries(user()?.teams || {}) as [id, name]}
      <li>
        <b>{name}</b>
        <small>{id}</small>
        <button class="c-button -caution -small" onclick={() => removeTeam(id)}>
          <svg-icon src="/img/icon/remove.svg">
            {i18n.t({ en: "Remove", ja: "削除", "zh-cn": "删除" })}
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
      * {
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
