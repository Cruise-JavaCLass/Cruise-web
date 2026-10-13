import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ExcursionModal } from './ExcursionModal';
import * as excursionService from '../../services/excursionService';

describe('ExcursionModal Component Tests (KAN-172 & KAN-174)', () => {
  const mockOnClose = vi.fn();
  const mockOnSuccess = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders correctly in Create mode with default values', () => {
    render(
      <ExcursionModal
        isOpen={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    expect(
      screen.getByRole('heading', { name: /Tạo Tour Trên Bờ Mới/i })
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/Tên Tour Trên Bờ/i)).toHaveValue('');
    expect(screen.getByLabelText(/Mã Excursion/i)).toHaveValue('');
    expect(screen.getByLabelText(/Nhà Cung Cấp Tour Địa Phương/i)).toHaveValue('');
  });

  it('does not render anything when isOpen is false', () => {
    const { container } = render(
      <ExcursionModal
        isOpen={false}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    expect(container).toBeEmptyDOMElement();
  });

  it('renders correctly in Edit mode with pre-filled excursion data', () => {
    const mockExcursion = excursionService.INITIAL_EXCURSIONS[0];

    render(
      <ExcursionModal
        isOpen={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
        excursionToEdit={mockExcursion}
      />
    );

    expect(
      screen.getByRole('heading', { name: /Chỉnh Sửa Tour Trên Bờ/i })
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/Tên Tour Trên Bờ/i)).toHaveValue(mockExcursion.title);
    expect(screen.getByLabelText(/Mã Excursion/i)).toHaveValue(mockExcursion.code);
    expect(screen.getByLabelText(/Nhà Cung Cấp Tour Địa Phương/i)).toHaveValue(
      mockExcursion.operatorName
    );
  });

  it('displays validation errors when submitting with empty required fields', async () => {
    const user = userEvent.setup();

    render(
      <ExcursionModal
        isOpen={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    const submitBtn = screen.getByRole('button', { name: /Tạo Excursion/i });
    await user.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText('Tên tour trên bờ không được để trống')).toBeInTheDocument();
      expect(screen.getByText('Mã excursion không được để trống')).toBeInTheDocument();
      expect(
        screen.getByText('Nhà cung cấp tour địa phương không được để trống')
      ).toBeInTheDocument();
    });

    expect(mockOnSuccess).not.toHaveBeenCalled();
  });

  it('validates timing order: departure must be after meeting time', async () => {
    const user = userEvent.setup();

    render(
      <ExcursionModal
        isOpen={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    const titleInput = screen.getByLabelText(/Tên Tour Trên Bờ/i);
    const codeInput = screen.getByLabelText(/Mã Excursion/i);
    const opInput = screen.getByLabelText(/Nhà Cung Cấp Tour Địa Phương/i);
    const meetingInput = screen.getByLabelText(/Giờ Tập Trung/i);
    const departureInput = screen.getByLabelText(/Giờ Xuất Bến/i);

    await user.type(titleInput, 'Tour Chợ Đêm');
    await user.type(codeInput, 'EXC-CHODEM-01');
    await user.type(opInput, 'Night Market Co');

    // Departure time earlier than meeting time
    await user.clear(meetingInput);
    await user.type(meetingInput, '18:30');
    await user.clear(departureInput);
    await user.type(departureInput, '18:00');

    const submitBtn = screen.getByRole('button', { name: /Tạo Excursion/i });
    await user.click(submitBtn);

    await waitFor(() => {
      expect(
        screen.getByText('Giờ khởi hành phải sau hoặc cùng giờ tập trung')
      ).toBeInTheDocument();
    });
  });

  it('validates timing order: return to ship must not be later than all-aboard time', async () => {
    const user = userEvent.setup();

    render(
      <ExcursionModal
        isOpen={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    const titleInput = screen.getByLabelText(/Tên Tour Trên Bờ/i);
    const codeInput = screen.getByLabelText(/Mã Excursion/i);
    const opInput = screen.getByLabelText(/Nhà Cung Cấp Tour Địa Phương/i);
    const returnInput = screen.getByLabelText(/Về Lại Tàu/i);
    const allAboardInput = screen.getByLabelText(/All-Aboard/i);

    await user.type(titleInput, 'Tour Ngắm San Hô Đảo');
    await user.type(codeInput, 'EXC-SANHO-01');
    await user.type(opInput, 'Diving Tour Co');

    // Set return time (16:00) later than all aboard time (15:00)
    await user.clear(returnInput);
    await user.type(returnInput, '16:00');
    await user.clear(allAboardInput);
    await user.type(allAboardInput, '15:00');

    const submitBtn = screen.getByRole('button', { name: /Tạo Excursion/i });
    await user.click(submitBtn);

    await waitFor(() => {
      expect(
        screen.getByText('Giờ quay lại tàu không thể trễ hơn giờ tàu nhổ neo (All Aboard)')
      ).toBeInTheDocument();
    });
  });

  it('dynamically displays safety margin messages based on return time and all-aboard time', async () => {
    const user = userEvent.setup();

    render(
      <ExcursionModal
        isOpen={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    const returnInput = screen.getByLabelText(/Về Lại Tàu/i);
    const allAboardInput = screen.getByLabelText(/All-Aboard/i);

    // Case 1: Standard safe margin >= 30 mins (e.g. 11:30 return, 12:00 all aboard = 30m)
    await user.clear(returnInput);
    await user.type(returnInput, '11:30');
    await user.clear(allAboardInput);
    await user.type(allAboardInput, '12:00');

    expect(
      screen.getByText(/Đạt chuẩn an toàn hải hành \(>= 30 phút\)/i)
    ).toBeInTheDocument();

    // Case 2: Short margin < 30 mins but >= 0 (e.g. 11:45 return, 12:00 all aboard = 15m)
    await user.clear(returnInput);
    await user.type(returnInput, '11:45');
    expect(
      screen.getByText(/Cảnh báo: Khoảng cách ngắn dưới 30 phút/i)
    ).toBeInTheDocument();

    // Case 3: Negative margin (e.g. 12:15 return, 12:00 all aboard)
    await user.clear(returnInput);
    await user.type(returnInput, '12:15');
    expect(
      screen.getByText(/Nguy hiểm: Giờ về tàu muộn hơn giờ xuất bến/i)
    ).toBeInTheDocument();
  });

  it('validates paid tour requires price greater than zero', async () => {
    const user = userEvent.setup();

    render(
      <ExcursionModal
        isOpen={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    const titleInput = screen.getByLabelText(/Tên Tour Trên Bờ/i);
    const codeInput = screen.getByLabelText(/Mã Excursion/i);
    const opInput = screen.getByLabelText(/Nhà Cung Cấp Tour Địa Phương/i);

    await user.type(titleInput, 'Tour Chèo Thuyền Kayak');
    await user.type(codeInput, 'EXC-KAYAK-01');
    await user.type(opInput, 'Kayak Co');

    // Uncheck included in package checkbox
    const includedCheckbox = screen.getByRole('checkbox', {
      name: /Đã bao gồm trong giá vé Cruise/i,
    });
    await user.click(includedCheckbox);

    // Price input appears and defaults to 0
    const priceInput = screen.getByLabelText(/Giá Vé Bổ Sung/i);
    expect(priceInput).toBeInTheDocument();

    const submitBtn = screen.getByRole('button', { name: /Tạo Excursion/i });
    await user.click(submitBtn);

    await waitFor(() => {
      expect(
        screen.getByText('Tour có tính phí bắt buộc phải có giá lớn hơn 0')
      ).toBeInTheDocument();
    });
  });

  it('validates max capacity boundaries (greater than 0 and <= 1000)', async () => {
    const user = userEvent.setup();

    render(
      <ExcursionModal
        isOpen={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    await user.type(screen.getByLabelText(/Tên Tour Trên Bờ/i), 'Tour Lặn Biển San Hô');
    await user.type(screen.getByLabelText(/Mã Excursion/i), 'EXC-LANBIEN-01');
    await user.type(screen.getByLabelText(/Nhà Cung Cấp Tour Địa Phương/i), 'Coral Reef Co');

    const capacityInput = screen.getByLabelText(/Sức Chứa Tối Đa/i);

    // Empty or 0
    await user.clear(capacityInput);

    const submitBtn = screen.getByRole('button', { name: /Tạo Excursion/i });
    await user.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText('Số lượng chỗ tối đa phải lớn hơn 0')).toBeInTheDocument();
    });

    // Exceeds 1000
    await user.type(capacityInput, '1500');
    await user.click(submitBtn);

    await waitFor(() => {
      expect(
        screen.getByText('Sức chứa của một đoàn tour trên bờ không quá 1000 khách')
      ).toBeInTheDocument();
    });
  });

  it('updates category and difficulty dropdown selections', async () => {
    const user = userEvent.setup();

    render(
      <ExcursionModal
        isOpen={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    const categorySelect = screen.getByLabelText(/Chủ Đề \/ Thể Loại/i);
    await user.selectOptions(categorySelect, 'CULINARY');
    expect(categorySelect).toHaveValue('CULINARY');

    const difficultySelect = screen.getByLabelText(/Mức Độ Vận Động/i);
    await user.selectOptions(difficultySelect, 'CHALLENGING');
    expect(difficultySelect).toHaveValue('CHALLENGING');
  });

  it('submits form successfully and calls onSuccess & onClose in Create mode', async () => {
    const user = userEvent.setup();
    const createSpy = vi.spyOn(excursionService, 'createExcursion');

    render(
      <ExcursionModal
        isOpen={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    await user.type(screen.getByLabelText(/Tên Tour Trên Bờ/i), 'Tour Vịnh Lan Hạ Đảo Cát Bà');
    await user.type(screen.getByLabelText(/Mã Excursion/i), 'EXC-LANHA-01');
    await user.type(screen.getByLabelText(/Nhà Cung Cấp Tour Địa Phương/i), 'Lan Ha Travel');

    const submitBtn = screen.getByRole('button', { name: /Tạo Excursion/i });
    await user.click(submitBtn);

    await waitFor(() => {
      expect(createSpy).toHaveBeenCalled();
      expect(mockOnSuccess).toHaveBeenCalled();
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  it('submits form successfully in Edit mode and calls updateExcursion', async () => {
    const user = userEvent.setup();
    const updateSpy = vi.spyOn(excursionService, 'updateExcursion');
    const mockExcursion = excursionService.INITIAL_EXCURSIONS[1];

    render(
      <ExcursionModal
        isOpen={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
        excursionToEdit={mockExcursion}
      />
    );

    const titleInput = screen.getByLabelText(/Tên Tour Trên Bờ/i);
    await user.clear(titleInput);
    await user.type(titleInput, 'Di Sản Phố Cổ Hội An & Trà Quế VIP');

    const submitBtn = screen.getByRole('button', { name: /Lưu Cập Nhật/i });
    await user.click(submitBtn);

    await waitFor(() => {
      expect(updateSpy).toHaveBeenCalledWith(
        mockExcursion.id,
        expect.objectContaining({ title: 'Di Sản Phố Cổ Hội An & Trà Quế VIP' }),
        expect.any(String),
        expect.any(String)
      );
      expect(mockOnSuccess).toHaveBeenCalled();
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  it('displays error message if API fails during submission', async () => {
    const user = userEvent.setup();
    vi.spyOn(excursionService, 'createExcursion').mockRejectedValueOnce(new Error('API Fail'));

    render(
      <ExcursionModal
        isOpen={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    await user.type(screen.getByLabelText(/Tên Tour Trên Bờ/i), 'Tour Làng Chài Cửa Vạn');
    await user.type(screen.getByLabelText(/Mã Excursion/i), 'EXC-CUAVAN-01');
    await user.type(screen.getByLabelText(/Nhà Cung Cấp Tour Địa Phương/i), 'Halong Local');

    const submitBtn = screen.getByRole('button', { name: /Tạo Excursion/i });
    await user.click(submitBtn);

    await waitFor(() => {
      expect(
        screen.getByText('Không thể lưu thông tin excursion. Vui lòng kiểm tra lại kết nối!')
      ).toBeInTheDocument();
    });
  });
});
