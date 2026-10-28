// The places this viewer can show, chosen with ?place=<id> (or #<id>); the first one is the default.
// Add one entry per building. pivot (camera target height), span (vertical extent in metres) and width are
// optional framing overrides; without them the viewer frames the model's bounding box.
export const places = [
  { id: 'post-office', title: 'Little Post Office', module: () => import('../buildings/09-little-post-office/PostOffice.js'), factory: 'createPostOffice', pivot: 3.7, span: 15.6, width: 14.6 },
];
