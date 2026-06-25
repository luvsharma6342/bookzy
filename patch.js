const fs = require('fs');
const file = 'e:/Freelance projects/bookzy/src/app/dashboard/page.tsx';
let content = fs.readFileSync(file, 'utf8');

// Replace activeView union
content = content.replace(
  "const [activeView, setActiveView] = useState<'analytics' | 'bookings' | 'services' | 'availability' | 'whatsapp' | 'staff' | 'settings'>('analytics');",
  "const [activeView, setActiveView] = useState<'analytics' | 'bookings' | 'services' | 'availability' | 'whatsapp' | 'staff' | 'settings' | 'security'>('analytics');"
);

// Add Security to Sidebar navigation
const navSettingsBtn = `          <button 
            onClick={() => setActiveView('settings')} 
            className={\`btn btn-sm \${activeView === 'settings' ? 'btn-primary' : 'btn-outline'}\`}
            style={{ justifyContent: 'flex-start', width: '100%', border: 'none', marginTop: '0.5rem' }}
          >
            <Settings size={18} />
            <span>Business Settings</span>
          </button>`;

const newNavBtns = `          <button 
            onClick={() => setActiveView('security')} 
            className={\`btn btn-sm \${activeView === 'security' ? 'btn-primary' : 'btn-outline'}\`}
            style={{ justifyContent: 'flex-start', width: '100%', border: 'none', marginTop: '0.5rem' }}
          >
            <ShieldCheck size={18} />
            <span>Password & Security</span>
          </button>
` + navSettingsBtn;

content = content.replace(navSettingsBtn, newNavBtns);

// Add Imports at top
const imports = `import AnalyticsView from './views/AnalyticsView';
import BookingsView from './views/BookingsView';
import ServicesView from './views/ServicesView';
import AvailabilityView from './views/AvailabilityView';
import WhatsAppView from './views/WhatsAppView';
import StaffView from './views/StaffView';
import SettingsView from './views/SettingsView';
import SecurityView from './views/SecurityView';`;

content = content.replace("export default function MerchantDashboard() {", imports + "\n\nexport default function MerchantDashboard() {");

// Replace views
const viewStartMarker = "{/* VIEW 1: OVERVIEW & ANALYTICS CHARTS */}";
const viewEndMarker = "{/* ─── ADD MANUAL BOOKING MODAL ─────────────────────────────── */}";

const viewStartIndex = content.indexOf(viewStartMarker);
const viewEndIndex = content.indexOf(viewEndMarker);

if (viewStartIndex > -1 && viewEndIndex > -1) {
  const newViews = `{/* RENDERING VIEWS */}
        {activeView === 'analytics' && (
          <AnalyticsView 
            stats={stats} 
            bookings={bookings} 
            chartData={chartData} 
            sourceData={sourceData} 
          />
        )}
        
        {activeView === 'bookings' && (
          <BookingsView 
            business={business}
            bookings={bookings}
            staffList={staffList}
            services={services}
            bookingFilter={bookingFilter}
            setBookingFilter={setBookingFilter}
            bookingSearch={bookingSearch}
            setBookingSearch={setBookingSearch}
            bookingDateFrom={bookingDateFrom}
            setBookingDateFrom={setBookingDateFrom}
            bookingDateTo={bookingDateTo}
            setBookingDateTo={setBookingDateTo}
            handleUpdateBookingStatus={handleUpdateBookingStatus}
            handleSendReminder={handleSendReminder}
            handleSendReviewRequest={handleSendReviewRequest}
            setShowAddBookingModal={setShowAddBookingModal}
            handleCSVExport={handleCSVExport}
          />
        )}

        {activeView === 'services' && (
          <ServicesView 
            business={business}
            services={services}
            CATEGORY_MAP={CATEGORY_MAP}
            handleAddServiceSubmit={handleAddServiceSubmit}
            handleToggleService={handleToggleService}
            openEditService={openEditService}
            reloadData={reloadData}
            showAddService={showAddService}
            setShowAddService={setShowAddService}
            newServiceName={newServiceName}
            setNewServiceName={setNewServiceName}
            newServiceCategory={newServiceCategory}
            setNewServiceCategory={setNewServiceCategory}
            newServicePrice={newServicePrice}
            setNewServicePrice={setNewServicePrice}
            newServiceDuration={newServiceDuration}
            setNewServiceDuration={setNewServiceDuration}
            newServiceDesc={newServiceDesc}
            setNewServiceDesc={setNewServiceDesc}
          />
        )}

        {activeView === 'availability' && (
          <AvailabilityView 
            business={business}
            blockedDates={blockedDates}
            handleUpdateWorkingHours={handleUpdateWorkingHours}
            reloadData={reloadData}
            showToast={showToast}
          />
        )}

        {activeView === 'whatsapp' && (
          <WhatsAppView 
            business={business}
            reloadData={reloadData}
            showToast={showToast}
          />
        )}

        {activeView === 'staff' && (
          <StaffView 
            business={business}
            staffList={staffList}
            openAddStaff={openAddStaff}
            openEditStaff={openEditStaff}
            reloadData={reloadData}
          />
        )}

        {activeView === 'settings' && (
          <SettingsView 
            business={business}
            setBusiness={setBusiness}
            paymentLoading={paymentLoading}
            handleUpgrade={handleUpgrade}
            cancelLoading={cancelLoading}
            handleCancelSubscription={handleCancelSubscription}
            reloadData={reloadData}
            showToast={showToast}
          />
        )}

        {activeView === 'security' && (
          <SecurityView 
            hasPasswordAccount={hasPasswordAccount}
            showToast={showToast}
          />
        )}

      `;
  
  content = content.substring(0, viewStartIndex) + newViews + content.substring(viewEndIndex);
} else {
  console.log("Could not find start or end markers for views!");
}

fs.writeFileSync(file, content, 'utf8');
console.log('Patched');
