<script setup>
import { reactive, ref } from "vue";

const itemName = ref("");
const condition = ref("");
const submitted = ref(false);

const errors = reactive({
  itemName: "",
  condition: "",
});

function validateForm() {
  errors.itemName = "";
  errors.condition = "";
  submitted.value = false;

  const cleanedItemName = itemName.value.trim();

  if (!cleanedItemName) {
    errors.itemName = "Item name is required.";
  } else if (!/[a-zA-Z0-9]/.test(cleanedItemName)) {
    errors.itemName = "Item name must contain a letter or number.";
  } else if (cleanedItemName.length > 50) {
    errors.itemName = "Item name must not exceed 50 characters.";
  }

  if (!condition.value) {
    errors.condition = "Please select the condition of the item.";
  }

  if (!errors.itemName && !errors.condition) {
    submitted.value = true;
  }
}
</script>

<template>
  <section id="finder" class="container py-5">
    <div class="row justify-content-center">
      <div class="col-12 col-md-9 col-lg-7">
        <div class="card border-0 shadow-sm">
          <div class="card-body p-4 p-md-5">
            <h2 class="text-center fw-bold">Waste Item Finder</h2>

            <p class="text-center text-secondary mb-4">
              Enter an unwanted item to find a responsible next step.
            </p>

            <form novalidate @submit.prevent="validateForm">
              <div class="mb-3">
                <label for="itemName" class="form-label"> Item name </label>

                <input
                  id="itemName"
                  v-model="itemName"
                  type="text"
                  maxlength="50"
                  class="form-control"
                  :class="{ 'is-invalid': errors.itemName }"
                  placeholder="For example, mobile phone"
                  @input="errors.itemName = ''"
                />

                <div class="invalid-feedback">
                  {{ errors.itemName }}
                </div>
              </div>

              <div class="mb-4">
                <label for="condition" class="form-label"> Item condition </label>

                <select
                  id="condition"
                  v-model="condition"
                  class="form-select"
                  :class="{ 'is-invalid': errors.condition }"
                  @change="errors.condition = ''"
                >
                  <option value="" disabled>Select a condition</option>
                  <option value="working">Working</option>
                  <option value="repairable">Repairable</option>
                  <option value="broken">Broken</option>
                </select>

                <div class="invalid-feedback">
                  {{ errors.condition }}
                </div>
              </div>

              <button type="submit" class="btn btn-success w-100">Find the Best Option</button>
            </form>

            <div v-if="submitted" class="alert alert-success mt-4 mb-0" role="alert">
              Form submitted successfully for
              <strong>{{ itemName }}</strong
              >.
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
