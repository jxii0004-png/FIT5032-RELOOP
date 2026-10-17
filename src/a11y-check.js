import axe from 'axe-core';
export async function runAccessibilityCheck() {
  await new Promise((resolve) => setTimeout(resolve, 1000));
  const result = await axe.run({exclude:[['#a11y-results'],['#a11y-rerun']]}, { runOnly: {type:'tag',values:['wcag2a','wcag2aa','wcag21a','wcag21aa']} });
  const summary = { url: location.pathname, violations: result.violations.map(({id,impact,help,nodes})=>({id,impact,help,nodes:nodes.map(({target,failureSummary})=>({target,failureSummary}))})), incomplete: result.incomplete.map(({id,nodes})=>({id,targets:nodes.map(n=>n.target)})) };
  let output=document.querySelector('#a11y-results');
  if(!output){output=document.createElement('pre');output.id='a11y-results';document.body.append(output);}
  output.textContent=JSON.stringify(summary,null,2);
  if(!document.querySelector('#a11y-rerun')){const button=document.createElement('button');button.id='a11y-rerun';button.textContent='Run accessibility check';button.onclick=runAccessibilityCheck;document.body.append(button);}
}
