<script setup>
import { onMounted, reactive, ref } from "vue";
import { wasteItems } from "../data/wasteItems";
import { getCurrentUser } from "../services/auth";

const itemName = ref("");
const condition = ref("");
const result = ref(null);
const notFound = ref(false);
const searchHistory = ref([]);
const currentUser = getCurrentUser();
const selectedRating = ref("");
const averageRating = ref("0.0");
const ratingCount = ref(0);
const ratingMessage = ref("");
onMounted(() => {
  const savedHistory = localStorage.getItem("reloopSearchHistory");

  if (savedHistory) {
    try {
      searchHistory.value = JSON.parse(savedHistory);
    } catch {
      searchHistory.value = [];
    }
  }
});

function saveSearch(item) {
  const historyItem = {
    id: Date.now(),
    name: item.displayName,
    condition: condition.value,
    recommendation: item.options[condition.value],
  };

  searchHistory.value.unshift(historyItem);
  searchHistory.value = searchHistory.value.slice(0, 5);

  localStorage.setItem("reloopSearchHistory", JSON.stringify(searchHistory.value));
}

function clearHistory() {
  searchHistory.value = [];
  localStorage.removeItem("reloopSearchHistory");
}

const errors = reactive({
  itemName: "",
  condition: "",
});

function validateForm() {
  errors.itemName = "";
  errors.condition = "";
  result.value = null;
  notFound.value = false;

  const cleanedItemName = itemName.value.trim();

  if (!cleanedItemName) {
    errors.itemName = "Item name is required.";
  } else if (cleanedItemName.includes("<") || cleanedItemName.includes(">")) {
    errors.itemName = "Item name contains unsafe characters.";
  } else if (!/[a-zA-Z]/.test(cleanedItemName)) {
    errors.itemName = "Item name must contain at least one letter.";
  } else if (cleanedItemName.length > 50) {
    errors.itemName = "Item name must not exceed 50 characters.";
  }

  if (!condition.value) {
    errors.condition = "Please select the condition of the item.";
  }

  if (errors.itemName || errors.condition) {
    return;
  }

  const searchTerm = cleanedItemName.toLowerCase();

  const matchedItem = wasteItems.find((item) => item.names.includes(searchTerm));

  if (matchedItem) {
    result.value = {
      itemId: matchedItem.id,
      displayName: matchedItem.displayName,
      category: matchedItem.category,
      recommendation: matchedItem.options[condition.value],
    };

    updateRatingDetails(matchedItem.id);

    saveSearch(matchedItem);
  } else {
    notFound.value = true;
  }
}
function getRatings() {
  try {
    return JSON.parse(localStorage.getItem("reloopRatings")) || [];
  } catch {
    return [];
  }
}

function updateRatingDetails(itemId) {
  const itemRatings = getRatings().filter((rating) => rating.itemId === itemId);

  ratingCount.value = itemRatings.length;

  if (itemRatings.length === 0) {
    averageRating.value = "0.0";
  } else {
    const total = itemRatings.reduce((sum, rating) => sum + rating.score, 0);

    averageRating.value = (total / itemRatings.length).toFixed(1);
  }

  const existingRating = itemRatings.find((rating) => rating.userId === currentUser?.id);

  selectedRating.value = existingRating ? String(existingRating.score) : "";
}

function submitRating() {
  ratingMessage.value = "";

  if (!currentUser) {
    ratingMessage.value = "Please log in before rating.";
    return;
  }

  if (!selectedRating.value) {
    ratingMessage.value = "Please select a rating.";
    return;
  }

  const ratings = getRatings();

  const existingIndex = ratings.findIndex(
    (rating) => rating.itemId === result.value.itemId && rating.userId === currentUser.id,
  );

  const newRating = {
    itemId: result.value.itemId,
    userId: currentUser.id,
    score: Number(selectedRating.value),
  };

  if (existingIndex >= 0) {
    ratings[existingIndex] = newRating;
  } else {
    ratings.push(newRating);
  }

  localStorage.setItem("reloopRatings", JSON.stringify(ratings));

  ratingMessage.value = "Rating submitted successfully.";
  updateRatingDetails(result.value.itemId);
}
</script>

<template>
  <section id="finder" class="finder-section container py-2 py-md-5">
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

            <div v-if="result" class="card bg-light border-success mt-4">
              <div class="card-body">
                <p class="text-success fw-semibold mb-1">Recommended next step</p>

                <h3 class="h5">{{ result.displayName }}</h3>

                <p class="mb-2"><strong>Category:</strong> {{ result.category }}</p>

                <p class="mb-3">
                  {{ result.recommendation }}
                </p>
                <hr />

                <h4 class="h6">Was this recommendation helpful?</h4>

                <p class="mb-3">
                  <strong>Average rating:</strong>
                  {{ averageRating }} / 5
                  <span class="text-secondary"> ({{ ratingCount }} ratings) </span>
                </p>

                <div v-if="currentUser">
                  <div class="d-flex flex-column flex-sm-row gap-2">
                    <select
                      v-model="selectedRating"
                      class="form-select"
                      aria-label="Select a rating"
                    >
                      <option value="" disabled>Select a rating</option>
                      <option value="1">1 - Poor</option>
                      <option value="2">2 - Fair</option>
                      <option value="3">3 - Good</option>
                      <option value="4">4 - Very good</option>
                      <option value="5">5 - Excellent</option>
                    </select>

                    <button type="button" class="btn btn-success" @click="submitRating">
                      Submit Rating
                    </button>
                  </div>
                </div>

                <p v-else class="mb-0">
                  <RouterLink to="/login">Login</RouterLink>
                  to submit a rating.
                </p>

                <div v-if="ratingMessage" class="alert alert-info mt-3 mb-0">
                  {{ ratingMessage }}
                </div>
              </div>
            </div>

            <div v-if="notFound" class="alert alert-warning mt-4 mb-0" role="alert">
              We could not find this item. Try TV, mobile phone, clothing, battery or furniture.
            </div>
            <div v-if="searchHistory.length > 0" class="mt-5">
              <div class="d-flex justify-content-between align-items-center mb-3">
                <h3 class="h5 mb-0">Recent Searches</h3>

                <button type="button" class="btn btn-outline-danger btn-sm" @click="clearHistory">
                  Clear History
                </button>
              </div>

              <div class="list-group">
                <div
                  v-for="historyItem in searchHistory"
                  :key="historyItem.id"
                  class="list-group-item"
                >
                  <div class="d-flex flex-column flex-md-row justify-content-between gap-2">
                    <div>
                      <strong>{{ historyItem.name }}</strong>

                      <span class="badge bg-secondary ms-2 text-capitalize">
                        {{ historyItem.condition }}
                      </span>
                    </div>

                    <small class="text-secondary">
                      {{ historyItem.recommendation }}
                    </small>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
@media (max-width: 767.98px) {
  .finder-section {
    min-height: calc(100dvh - 56px);
    display: flex;
    align-items: center;
  }

  .finder-section > .row {
    width: 100%;
  }
}
</style>
