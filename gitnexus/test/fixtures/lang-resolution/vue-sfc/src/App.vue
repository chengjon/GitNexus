<template>
  <Widget />
</template>

<script setup lang="ts">
import Widget from './Widget.vue';
import { fetchUsers } from './user';

export function loadUsers() {
  return fetchUsers();
}
</script>
