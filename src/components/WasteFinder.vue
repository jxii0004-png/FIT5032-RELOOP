<script setup>
import { onMounted, reactive, ref } from "vue";
import { wasteItems } from "../data/wasteItems";
import { currentUser } from "../services/auth";
import { trackSearch } from "../services/searchStats";
import { focusElement } from "../services/accessibility";
import { readLocalArray, writeLocalArray, clearLocalArray, validSearchRecord, validRatingRecord } from "../services/localRecords";
const storageMessage = ref("");
const trackingMessage = ref("");
let searchVersion = 0;

const itemName = ref("");
const condition = ref("");
const result = ref(null);
const notFound = ref(false);
const searchHistory = ref([]);
const selectedRating = ref("");
const averageRating = ref("0.0");
const ratingCount = ref(0);
const ratingMessage = ref("");
onMounted(() => {
  searchHistory.value = readLocalArray("reloopSearchHistory", validSearchRecord).slice(0, 5);
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

  storageMessage.value = writeLocalArray("reloopSearchHistory", searchHistory.value) ? "" : "Your result is ready, but this browser could not save recent history.";
}

function clearHistory() {
  searchHistory.value = [];
  storageMessage.value = clearLocalArray("reloopSearchHistory") ? "History cleared." : "History cleared for this page, but saved browser history could not be removed.";
}

const errors = reactive({
  itemName: "",
  condition: "",
});

function validateForm() {
  const version = ++searchVersion;
  trackingMessage.value = "";
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
    focusElement(errors.itemName ? "itemName" : "condition");
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
    if (currentUser.value) {
      trackingMessage.value = "Updating search statistics…";
      trackSearch(matchedItem.id, condition.value).then(() => {
        if (version === searchVersion) trackingMessage.value = "Search included in site statistics.";
      }).catch(() => {
        if (version === searchVersion) trackingMessage.value = "Your result is ready, but site statistics could not be updated.";
      });
    }
  } else {
    notFound.value = true;
  }
}
function getRatings() {
  return readLocalArray("reloopRatings", validRatingRecord);
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

  const existingRating = itemRatings.find((rating) => rating.userId === currentUser.value?.id);

  selectedRating.value = existingRating ? String(existingRating.score) : "";
}

function submitRating() {
  ratingMessage.value = "";

  if (!currentUser.value) {
    ratingMessage.value = "Please log in before rating.";
    return;
  }

  if (![1, 2, 3, 4, 5].includes(Number(selectedRating.value))) {
    ratingMessage.value = "Please select a rating.";
    return;
  }

  const ratings = getRatings();

  const existingIndex = ratings.findIndex(
    (rating) => rating.itemId === result.value.itemId && rating.userId === currentUser.value.id,
  );

  const newRating = {
    itemId: result.value.itemId,
    userId: currentUser.value.id,
    score: Number(selectedRating.value),
  };

  if (existingIndex >= 0) {
    ratings[existingIndex] = newRating;
  } else {
    ratings.push(newRating);
  }

  const saved = writeLocalArray("reloopRatings", ratings);

  ratingMessage.value = saved ? "Rating saved on this device." : "Your browser could not save the rating. Please try again.";
  updateRatingDetails(result.value.itemId);
}
</script>

<template>
  <section id="finder" tabindex="-1" aria-labelledby="finder-heading" class="finder-section container py-2 py-md-5">
    <div class="row justify-content-center">
      <div class="col-12 col-md-9 col-lg-7">
        <div class="card border-0 shadow-sm">
          <div class="card-body p-4 p-md-5">
            <h2 id="finder-heading" class="text-center fw-bold">Waste Item Finder</h2>

            <p class="text-center text-secondary mb-4">
              Enter an unwanted item to find a responsible next step.
            </p>

            <form novalidate @submit.prevent="validateForm">
              <p class="small text-secondary">Successful searches by signed-in users contribute to site statistics. Your recent history is stored on this device.</p>
              <div class="mb-3">
                <label for="itemName" class="form-label"> Item name </label>

                <input
                  id="itemName"
                  v-model="itemName"
                  type="text"
                  maxlength="50"
                  class="form-control"
                  required
                  :aria-invalid="Boolean(errors.itemName)"
                  :aria-describedby="errors.itemName ? 'item-name-error' : undefined"
                  :class="{ 'is-invalid': errors.itemName }"
                  placeholder="For example, mobile phone"
                  @input="errors.itemName = ''"
                />

                <div id="item-name-error" class="invalid-feedback">
                  {{ errors.itemName }}
                </div>
              </div>

              <div class="mb-4">
                <label for="condition" class="form-label"> Item condition </label>

                <select
                  id="condition"
                  v-model="condition"
                  class="form-select"
                  required
                  :aria-invalid="Boolean(errors.condition)"
                  :aria-describedby="errors.condition ? 'condition-error' : undefined"
                  :class="{ 'is-invalid': errors.condition }"
                  @change="errors.condition = ''"
                >
                  <option value="" disabled>Select a condition</option>
                  <option value="working">Working</option>
                  <option value="repairable">Repairable</option>
                  <option value="broken">Broken</option>
                </select>

                <div id="condition-error" class="invalid-feedback">
                  {{ errors.condition }}
                </div>
              </div>

              <button type="submit" class="btn btn-success w-100">Find the Best Option</button>
            </form>
            <p class="small text-secondary" role="status">{{ storageMessage }}</p>
            <p class="visually-hidden" role="status">{{ result ? `${result.displayName}: ${result.recommendation}` : '' }}</p>
            <p v-if="trackingMessage" class="small text-secondary mt-3" role="status">{{ trackingMessage }}</p>

            <div v-if="result" class="card bg-light border-success mt-4">
              <div class="card-body">
                <p class="text-success fw-semibold mb-1">Recommended next step</p>

                <h3 class="h5">{{ result.displayName }}</h3>
                <RouterLink to="/locations" class="btn btn-outline-success btn-sm mb-3 me-2">Find recycling locations and routes</RouterLink>
                <RouterLink :to="{ path: '/plans', query: { item: result.itemId } }" class="btn btn-outline-success btn-sm mb-3">Add to my recycling plans</RouterLink>

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

                <div v-if="ratingMessage" class="alert alert-info mt-3 mb-0" role="status">
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
