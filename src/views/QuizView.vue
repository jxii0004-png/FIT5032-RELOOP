<script setup>
import { computed, ref } from 'vue';
import { quizQuestions, scoreQuiz } from '../data/recyclingQuiz';
import { focusElement } from '../services/accessibility';
import RecyclingToolsNav from '../components/RecyclingToolsNav.vue';
const answers = ref(quizQuestions.map(() => ''));
const submitted = ref(false);
const error = ref('');
const score = computed(() => scoreQuiz(answers.value));
function submit() {
  const missing = answers.value.findIndex((answer) => answer === '');
  if (missing !== -1) { error.value = `Please answer question ${missing + 1}.`; focusElement(`quiz-${missing}-0`); return; }
  error.value = '';
  submitted.value = true;
  focusElement('quiz-result');
}
function reset() {
  answers.value = quizQuestions.map(() => '');
  submitted.value = false;
  error.value = '';
  focusElement('quiz-0-0');
}
</script>
<template>
  <main id="main-content" tabindex="-1" class="container py-5">
    <h1>Recycling knowledge quiz</h1>
    <RecyclingToolsNav />
    <p>Answer five questions, then check your score and explanations. Guidance is for Victoria; check local services before disposing of an item.</p>
    <p class="small text-secondary">All questions are required. Your answers stay on this page and are not saved to your account.</p>
    <p v-if="error" class="alert alert-danger" role="alert">{{ error }}</p>
    <div v-if="submitted" id="quiz-result" tabindex="-1" class="alert alert-success" role="status"><h2 class="h4">Your score: {{ score }} / {{ quizQuestions.length }}</h2><p class="mb-0">Review the explanations below, or try again.</p></div>
    <form novalidate @submit.prevent="submit">
      <fieldset v-for="(question, index) in quizQuestions" :key="question.question" class="card card-body mb-3" :disabled="submitted">
        <legend class="h5 float-none w-auto px-2">{{ index + 1 }}. {{ question.question }}</legend>
        <div v-for="(option, choice) in question.options" :key="option" class="form-check mb-2">
          <input :id="`quiz-${index}-${choice}`" v-model="answers[index]" class="form-check-input" type="radio" :name="`question-${index}`" :value="choice" required><label :for="`quiz-${index}-${choice}`" class="form-check-label">{{ option }}</label>
        </div>
        <div v-if="submitted" class="mt-2">
          <p class="fw-bold">{{ answers[index] === question.answer ? 'Correct.' : 'Not quite.' }} Correct answer: {{ question.options[question.answer] }}</p>
          <p>{{ question.explanation }}</p>
        </div>
      </fieldset>
      <button v-if="!submitted" type="submit" class="btn btn-success">Check answers</button><button v-else type="button" class="btn btn-outline-success" @click="reset">Try again</button>
    </form>
    <section class="mt-4"><h2 class="h5">Sources</h2><ul><li><a :href="quizQuestions[0].source" target="_blank" rel="noopener">Victorian Government: reuse and repair (opens in a new tab)</a></li><li><a :href="quizQuestions[1].source" target="_blank" rel="noopener">Victorian Government: batteries and electronic waste (opens in a new tab)</a></li></ul></section>
  </main>
</template>
