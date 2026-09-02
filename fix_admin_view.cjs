const fs = require('fs');

let adminView = fs.readFileSync('src/components/AdminView.tsx', 'utf8');

adminView = adminView.replace(/{ id: 'random_call', title: '🎯 Quay Gọi Ngẫu Nhiên' }/g, "{ id: 'randomcall', title: '🎯 Quay Gọi Ngẫu Nhiên' }");
adminView = adminView.replace(/{ id: 'egg_call', title: '🥚 Đập Trứng Gọi Tên' }/g, "{ id: 'eggcall', title: '🥚 Đập Trứng Gọi Tên' }");
adminView = adminView.replace(/{ id: 'tug_of_war', title: '🪢 Kéo Co Tri Thức' }/g, "{ id: 'tugofwar', title: '🪢 Kéo Co Tri Thức' }");

fs.writeFileSync('src/components/AdminView.tsx', adminView);
