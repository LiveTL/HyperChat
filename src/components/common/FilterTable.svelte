<script lang="ts">
    import type { Writable } from 'svelte/store';
    import { isRegexFilter, isNickNameFilter } from '../../ts/storage';
    import FilterInput from './FilterInput.svelte';
    export let store: Writable<{ id: number, value: string, isRegEx: boolean, isNicknameFilter: boolean }[]>;
    export let inputArea: string;

    $: isRegEx = $isRegexFilter;
    $: isNicknameFilter = $isNickNameFilter;
    $: value = inputArea;

    const updateStore = (id: number, value: string) => {
      inputArea = '';
      $store = [...$store, { id, value, isRegEx, isNicknameFilter }];
    };

    const deleteElement = (id: number) => {
      $store = $store.filter(element => element.id !== id);
    };
</script>

<FilterInput bind:isRegEx bind:inputArea />
<button on:click={updateStore(Date.now(), value)} class="text-white bg-primary-500 rounded h-8" style="width: 5rem">Add</button>
<div class="relative overflow-x-auto shadow-md sm:rounded-lg">
    <table class="w-full text-sm text-left text-gray-500 dark:text-gray-400">
        <thead class="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
        <tr>
            <th scope="col" class="px-6 py-3">
                Filter Type
            </th>
            <th scope="col" class="px-6 py-3">
                Filter Query
            </th>
            <th scope="col" class="px-6 py-3">
                Filtering by
            </th>
            <th scope="col" class="px-6 py-3">
                <span class="sr-only">Delete</span>
            </th>
        </tr>
        </thead>
        <tbody>
            {#each $store as element}
            <tr class="bg-white border-b dark:bg-gray-800 dark:border-gray-700">
                <th scope="row" class="px-6 py-4 font-medium text-gray-700 dark:text-white whitespace-nowrap">
                    {element.isRegEx ? 'Regular expression' : 'Filtering by contents'}
                </th>
                <td class="px-6 py-4 font-medium text-gray-700 dark:text-white whitespace-nowrap">
                    {element.value}
                </td>
                <td class="px-6 py-4 font-medium text-gray-700 dark:text-white whitespace-nowrap">
                    {element.isNicknameFilter ? 'Nickname' : 'Message'}
                </td>
                <td class="px-6 py-4 text-center">
                    <button on:click={deleteElement(element.id)} class="font-medium text-blue-600 dark:text-blue-500 hover:underline">Delete</button>
                </td>
            </tr>
            {/each}
        </tbody>
    </table>
</div>