<script lang="ts">
  import { store, user } from "@/lib/store.svelte";
  import Home from "@/lib/view/Home.svelte";

  $effect(() => {
    if (store.loading) return;
    if (!user() || Object.keys(user()?.teams || {}).length <= 0) {
      location.href = "/onboarding.html";
    }
  });
</script>

<Home />
