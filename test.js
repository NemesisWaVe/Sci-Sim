const json = '{\"text\": \"hello \\' world\"}'; try { console.log(JSON.parse(json)); } catch (e) { console.error(e.message); }
