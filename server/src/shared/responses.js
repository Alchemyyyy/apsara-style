function ok(res, data = null, extra = {}) {
  return res.json({ success: true, data, ...extra });
}

function okList(res, result, extra = {}) {
  return ok(res, result?.items || [], { meta: result?.meta, ...extra });
}

function noContentOk(res) {
  return res.json({ success: true });
}

module.exports = {
  noContentOk,
  ok,
  okList,
};
